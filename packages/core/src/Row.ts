import { isBoolean, isFunction, isUndefined, mapValues, omit } from 'lodash-es'
import { observable, makeObservable, action, Reaction } from 'mobx'
import {
  Column,
  RowRaw,
  CellValue,
  RowRaws,
  Rule,
  Filter,
  StaticComponentProps,
  RowProxy,
  RowErrors,
} from './types'
import { Cell } from './Cell'
import { Worktable } from './Worktable'
import { makeRowProxy, noThrow, walk, getDefaultValue } from './share'
import type { RuleItem } from 'async-validator'
import ValidateSchema from 'async-validator'
import { FIELD_EVENT_NAME } from './event'
import { deconstruct } from './field-parser'

type CellBoolState = 'previewing' | 'loading' | 'validating'
export class Row {
  static rid = 1
  rid: number
  data: Record<string, Cell> = {}
  children: Row[] = []
  parent?: Row
  rIndex = 0
  columns: Column[]
  disposers: Array<() => void> = []
  initialData: Record<string, any> = {}
  private wt?: Worktable

  static generateRows(columns: Column[], raws: RowRaws, parent?: Row, wt?: Worktable) {
    return raws.map((raw, index) => {
      const row = new Row(columns, raw, parent, index, wt)
      return row
    })
  }

  constructor(columns: Column[], raw: RowRaw = {}, parent?: Row, rIndex = 0, wt?: Worktable) {
    makeObservable(this, {
      rIndex: observable.ref,
      children: observable.shallow,
      addRow: action,
      addRows: action,
      sort: action,
    })

    this.wt = wt
    this.rid = Row.rid++
    this.columns = columns
    this.parent = parent
    this.rIndex = rIndex
    this.initialData = raw
    this.generate(raw)
    Object.values(this.data).forEach((cell) => {
      // track dynamic value
      cell.trackDynamicValue()
      // setup onFieldReact effect
      cell.setupOnFieldReactEffect()
    })

    // notify value initialization event
    this.notifyCellInitializationEvent()
    this.trackRowValidateHandle()
  }

  getShallowRaw() {
    let raw: Record<string, any> = {}
    for (const k in this.data) {
      if (!this.data[k].colDef.virtual) {
        raw[k] = this.data[k].cellValue
      }
    }
    const virtualKeys = [
      'children',
      ...this.columns.filter((colDef) => colDef.virtual).map((colDef) => colDef.field),
    ]
    raw = Object.assign(omit(this.initialData || {}, virtualKeys), raw)
    return raw
  }

  getRaw() {
    const raw = this.getShallowRaw()
    if (this.children.length > 0) {
      raw.children = this.children.map((child) => child.getRaw())
    }
    return raw
  }

  setValues(raw: Record<string, any>) {
    Object.keys(raw).forEach((key) => {
      if (this.data[key]) {
        this.data[key].setState('value', raw[key])
      } else {
        Object.assign(this.initialData, { [key]: raw[key] })
      }
    })
  }

  addRow(raw?: RowRaw): RowProxy {
    const row = new Row(this.columns, raw, this, 0, this.wt)
    row.rIndex = this.children.length
    this.children.push(row)
    return makeRowProxy(row)
  }

  addRows(raws: RowRaw[] = []): RowProxy[] {
    const rows: RowProxy[] = []
    raws.forEach((raw) => {
      rows.push(this.addRow(raw))
    })
    return rows
  }

  remove(rid: number): void
  remove(filter: Filter): void
  remove(filter: any): void {
    if (typeof filter === 'number') {
      filter = (row: Row) => row.rid === filter
    }
    const rows: Row[] = this.findAll(filter as Filter)
    rows.forEach((row) => this.removeRow(row))
  }

  removeRow(row: Row) {
    const workRows = this.children
    const index = workRows.findIndex((r) => r === row)
    if (index > -1) {
      const [removed] = workRows.splice(index, 1)
      removed.stopWatchValidation()
      // reset row.rIndex
      workRows.forEach((row, index) => (row.rIndex = index))
    }
  }

  removeAll() {
    this.remove(() => true)
  }

  removeSelf() {
    this.wt?.remove(this.rid)
  }

  sort(comparator: (a: RowProxy, b: RowProxy) => number) {
    this.children.sort((arow, brow) => comparator(makeRowProxy(arow), makeRowProxy(brow)))
  }

  stopWatchValidation() {
    this.disposers.forEach((disposer) => disposer())
    this.disposers = []
  }

  validate() {
    const validators: Promise<boolean>[] = []
    for (const field in this.data) {
      validators.push(this.validateCell(this.data[field], true))
    }
    return Promise.all(validators)
  }

  setComponentProps(field: string, extralProps: StaticComponentProps) {
    return this.data[field]?.setComponentProps(extralProps)
  }

  reset(field?: string | string[]) {
    if (field) {
      const fields = Array.isArray(field) ? field : [field]
      fields.forEach((field) => this.data[field]?.reset())
    } else {
      // reset all
      Object.values(this.data).forEach((cell) => cell.reset())
    }
  }

  setLoading(loading: boolean): void
  setLoading(field: string | string[], loading: boolean): void
  setLoading(field?: any, loading?: boolean) {
    if (typeof field === 'boolean') {
      loading = field
      field = Object.keys(this.data)
    }

    this.setBoolState(field, 'loading', !!loading)
  }

  get errors(): RowErrors {
    return mapValues(this.data, (cell) => cell.errors)
  }

  // private notifyCellValueEvent() {
  //   Object.values(this.data).forEach((cell) => {
  //     cell.notifyValueFieldEvent(FIELD_EVENT_NAME.ON_FIELD_VALUE_CHANGE)
  //     cell.notifyValueTableEvent(TABLE_EVENT_NAME.ON_FIELD_VALUE_CHANGE)
  //   })
  // }

  private setBoolState(field: string | string[], state: CellBoolState, val: boolean) {
    if (field) {
      const fields = Array.isArray(field) ? field : [field]
      fields.forEach((field) => this.data[field]?.setState(state, val))
    } else {
      // set all cells loading
      Object.values(this.data).forEach((cell) => cell.setState(state, val))
    }
  }

  private notifyCellInitializationEvent() {
    Object.values(this.data).forEach((cell) => {
      cell.notifyValueFieldEvent(FIELD_EVENT_NAME.ON_FIELD_INIT)
    })
  }

  private findAll(filter: Filter) {
    const rows: Row[] = []
    walk(this.children, (row) => {
      if (filter(makeRowProxy(row))) {
        rows.push(row)
      }
    })
    return rows
  }

  private trackRowValidateHandle() {
    for (const field in this.data) {
      const disposer = this.trackCellValidateHandle(this.data[field])
      this.disposers.push(disposer)
    }
  }

  private trackCellValidateHandle(cell: Cell) {
    const validator = noThrow(() => this.validateCell(cell))
    const reaction: Reaction = new Reaction(`${this.rid}-${cell.colDef.field}-validator`, () =>
      reaction.track(() => validator())
    )
    reaction.track(() => this.trackCellValidatorDep(cell))
    const disposer = () => reaction.dispose()
    return disposer
  }

  private validateCell(cell: Cell, force = false) {
    const needEmitError = cell.modified || force
    const colDef = cell.colDef
    const descriptor = this.makeCellVaidateDescriptor(colDef)
    const target = { [colDef.field]: cell.cellValue }
    cell.setState('validating', true)
    const validator = new ValidateSchema(descriptor)
    if (needEmitError) {
      this.wt?.notifyFieldEvent(
        colDef.field,
        FIELD_EVENT_NAME.ON_FIELD_VALUE_VALIDATE_START,
        cell.cellValue,
        makeRowProxy(this)
      )
    }
    return validator
      .validate(target)
      .then(() => {
        if (cell.errors.length > 0) {
          cell.setState('errors', [])
        }
        if (needEmitError) {
          this.wt?.notifyFieldEvent(
            colDef.field,
            FIELD_EVENT_NAME.ON_FIELD_VALUE_VALIDATE_SUCCESS,
            cell.cellValue,
            makeRowProxy(this)
          )
        }
        return true
      })
      .catch((err) => {
        if (needEmitError) {
          const errors = err.errors.map((err: any) => err.message)
          cell.setState('errors', errors)
          this.wt?.notifyFieldEvent(
            colDef.field,
            FIELD_EVENT_NAME.ON_FIELD_VALUE_VALIDATE_FAIL,
            cell.cellValue,
            makeRowProxy(this),
            errors
          )
        }
        throw err
      })
      .finally(() => {
        cell.setState('validating', false)
        if (needEmitError) {
          this.wt?.notifyFieldEvent(
            colDef.field,
            FIELD_EVENT_NAME.ON_FIELD_VALUE_VALIDATE_FINISH,
            cell.cellValue,
            makeRowProxy(this)
          )
        }
      })
  }

  private trackCellValidatorDep(cell: Cell) {
    const rules = this.getRules(cell.colDef).filter((rule) => isFunction(rule.asyncValidator))
    if (rules.length > 0) {
      const exec = async () => {
        try {
          await Promise.all(
            rules.map((rule) => {
              return rule.asyncValidator!(
                null as any,
                cell.cellValue,
                () => [],
                null as any,
                null as any
              )
            })
          )
        } catch {
          /* empty */
        }
      }
      return [exec()]
    }
    return [cell.cellValue]
  }

  private generate(raw: RowRaw) {
    this.columns.forEach((col) => {
      if (!col.field) return
      const val = raw?.[col.field] as CellValue
      const cell = Cell.generateBaseCell({
        parent: this,
        colDef: col,
        value: isUndefined(val) ? getDefaultValue(col.default) : val,
        evProxy: this.wt,
      })
      cell.position.field = col.field
      this.data[col.field] = cell
    })

    // bind deconstructed fields
    Object.entries(this.data).forEach(([field, cell]) => {
      const meta = deconstruct(field)
      if (meta) {
        cell.deconstructedType = meta.type
        meta.keyMaps.forEach(([from, to]) => {
          cell.deconstructedCells[from] = this.data[to]
        })
        cell.value = cell.mergeValue()
      }
    })

    if (Array.isArray(raw?.children)) {
      this.children = Row.generateRows(this.columns, raw!.children!, this, this.wt)
    }
  }

  private makeCellVaidateDescriptor(colDef: Column) {
    const descriptor: Record<string, RuleItem[]> = {
      [colDef.field]: [],
    }
    if (colDef.required) {
      descriptor[colDef.field].push({
        type: colDef.type,
        required: true,
        message: colDef.requiredMessage || '',
      })
    }
    const rules = this.getRules(colDef)
    descriptor[colDef.field].push(...rules)
    return descriptor
  }

  private makeCellAsyncVaidatorFn(rule: Rule) {
    const rowProxy = makeRowProxy(this)
    return async (_: any, value: any) => {
      const success = await rule.validator?.(value, rowProxy)
      if (isBoolean(success) && !success) {
        return Promise.reject(rule.message || 'validate error')
      }
    }
  }

  private getRules(colDef: Column): Array<Omit<RuleItem, 'transform' | 'validator'>> {
    let rules = colDef.rule
    if (!rules) return []
    if (!Array.isArray(rules)) {
      rules = [rules]
    }

    return rules.map((rule) => {
      const ruleItem = omit(rule, ['transform', 'asyncValidator', 'validator'])
      ruleItem.type = rule.type || colDef.type
      if (isFunction(rule.validator)) {
        Object.assign(ruleItem, {
          asyncValidator: this.makeCellAsyncVaidatorFn(rule),
        })
      }
      return ruleItem
    })
  }
}
