import { isBoolean, isFunction, isUndefined, omit } from 'lodash-es'
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
} from './types'
import { Cell } from './Cell'
import { Worktable } from './Worktable'
import { makeRowProxy, noThrow, walk, getDefault } from './share'
import { RuleItem } from 'async-validator'
import ValidateSchema from 'async-validator'
import { FIELD_EVENT_NAME, TABLE_EVENT_NAME } from './event'
import { deconstruct } from './field-parser'

export class Row {
  static rid = 1
  rid: number
  data: Record<string, Cell> = {}
  children: Row[] = []
  parent?: Row
  rIndex?: number
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

  constructor(columns: Column[], raw: RowRaw = {}, parent?: Row, rIndex?: number, wt?: Worktable) {
    makeObservable(this, {
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
        raw[k] = this.data[k].value
      }
    }
    raw = Object.assign(omit(this.initialData || {}, 'children'), raw)
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

  addRow(raw?: RowRaw) {
    const row = new Row(this.columns, raw, this, 0, this.wt)
    row.rIndex = this.children.length
    this.children.push(row)
  }

  addRows(raws: RowRaw[] = []) {
    raws.forEach((raw) => this.addRow(raw))
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

  validate(isFirstTrack = false) {
    const validators: Promise<boolean>[] = []
    for (const field in this.data) {
      validators.push(this.validateCell(this.data[field], isFirstTrack))
    }
    return Promise.all(validators)
  }

  setComponentProps(field: string, extralProps: StaticComponentProps) {
    return this.data[field]?.setComponentProps(extralProps)
  }

  reset(field?: string) {
    if (field) {
      const cell = this.data[field]
      cell?.setState(
        'value',
        cell.colDef.default
          ? this.getDefaultValue(cell.colDef.default)
          : getDefault(cell.colDef.type)
      )
    }
  }

  // private notifyCellValueEvent() {
  //   Object.values(this.data).forEach((cell) => {
  //     cell.notifyValueFieldEvent(FIELD_EVENT_NAME.ON_FIELD_VALUE_CHANGE)
  //     cell.notifyValueTableEvent(TABLE_EVENT_NAME.ON_FIELD_VALUE_CHANGE)
  //   })
  // }

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

  private validateCell(cell: Cell, isFirstTrack = false) {
    const colDef = cell.colDef
    const descriptor = this.makeCellVaidateDescriptor(colDef)
    const target = { [colDef.field]: cell.value }
    cell.setState('validating', true)
    const validator = new ValidateSchema(descriptor)
    if (!isFirstTrack) {
      this.wt?.notify(
        colDef.field,
        FIELD_EVENT_NAME.ON_FIELD_VALUE_VALIDATE_START,
        cell.value,
        makeRowProxy(this)
      )
    }
    return validator
      .validate(target)
      .then(() => {
        if (cell.errors.length > 0) {
          cell.setState('errors', [])
        }
        if (!isFirstTrack) {
          this.wt?.notify(
            colDef.field,
            FIELD_EVENT_NAME.ON_FIELD_VALUE_VALIDATE_SUCCESS,
            cell.value,
            makeRowProxy(this)
          )
        }
        return true
      })
      .catch((err) => {
        if (!isFirstTrack) {
          const errors = [err.errors[0]?.message]
          cell.setState('errors', errors)
          this.wt?.notify(
            colDef.field,
            FIELD_EVENT_NAME.ON_FIELD_VALUE_VALIDATE_FAIL,
            errors,
            cell.value,
            makeRowProxy(this)
          )
        }
        throw err
      })
      .finally(() => {
        cell.setState('validating', false)
        if (!isFirstTrack) {
          this.wt?.notify(
            colDef.field,
            FIELD_EVENT_NAME.ON_FIELD_VALUE_VALIDATE_FINISH,
            cell.value,
            makeRowProxy(this)
          )
        }
      })
  }

  private generate(raw: RowRaw) {
    this.columns.forEach((col) => {
      const val = raw?.[col.field] as CellValue
      const cell = Cell.generateBaseCell({
        parent: this,
        colDef: col,
        value: isUndefined(val) ? this.getDefaultValue(col.default) : val,
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

  private getDefaultValue<T>(_default: T | (() => T)) {
    return isFunction(_default) ? _default() : _default
  }

  private makeCellVaidateDescriptor(colDef: Column) {
    const descriptor: Record<string, RuleItem> = {}
    const rawRow = makeRowProxy(this)
    if (colDef.rule) {
      const rule = this.getRule(colDef.rule)
      rule.type = rule.type || colDef.type
      descriptor[colDef.field] = this.getRule(colDef.rule)
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
