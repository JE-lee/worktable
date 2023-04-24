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
import { RuleItem } from 'async-validator'
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
    // track dynamic value
    Object.values(this.data).forEach((cell) => cell.trackDynamicValue())
    // notify value initialization event
    this.notifyCellInitializationEvent()
    // notify value change event
    // this.notifyCellValueEvent()
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

  validate(force = false) {
    const validators: Promise<boolean>[] = []
    for (const field in this.data) {
      validators.push(this.validateCell(this.data[field], false, force))
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
    const validator = noThrow((isFirstTrack: boolean) => this.validateCell(cell, isFirstTrack))
    const reaction: Reaction = new Reaction(`${this.rid}-${cell.colDef.field}-validator`, () =>
      reaction.track(() => validator(false))
    )
    // FIXME: not call validator when first track
    reaction.track(() => validator(true))
    const disposer = () => reaction.dispose()
    return disposer
  }

  private validateCell(cell: Cell, isFirstTrack = false, force = false) {
    const needEmitError = (!isFirstTrack && cell.modified) || force
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
    const descriptor: Record<string, RuleItem> = {}
    const rawRow = makeRowProxy(this)
    if (colDef.required) {
      descriptor[colDef.field] = { type: colDef.type }
      descriptor[colDef.field].required = true
      descriptor[colDef.field].message = colDef.requiredMessage
    }
    if (colDef.rule) {
      descriptor[colDef.field] = descriptor[colDef.field] || { type: colDef.type }
      const rule = this.getRule(colDef.rule)
      rule.type = rule.type || colDef.type
      Object.assign(descriptor[colDef.field], rule)
      // validator
      if (isFunction(colDef.rule.validator)) {
        Object.assign(descriptor[colDef.field], {
          asyncValidator: this.makeCellAsyncVaidatorFn(colDef, rawRow),
        })
      }
    }
    return descriptor
  }

  private makeCellAsyncVaidatorFn(colDef: Column, rawRow: RowProxy) {
    return async (rule: any, value: any) => {
      if (isFunction(colDef?.rule?.validator)) {
        const success = await colDef?.rule?.validator(value, rawRow)
        if (isBoolean(success) && !success) {
          return Promise.reject(colDef?.rule?.message || 'validate error')
        }
      }
    }
  }

  private getRule(rule: Rule): Omit<Rule, 'transform' | 'asyncValidator' | 'validator'> {
    return omit(rule, ['transform', 'asyncValidator', 'validator'])
  }
}
