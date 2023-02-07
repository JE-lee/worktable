import { isBoolean, isFunction, omit } from 'lodash-es'
import { observable, makeObservable, runInAction, action, Reaction } from 'mobx'
import { Column, RowRaw, CellValue, RowRaws, Rule, Filter } from './types'
import { Cell } from './Cell'
import { Worktable } from './Worktable'
import { flatten, makeRowProxy, makeRowAction, noThrow, walk } from './share'
import { RuleItem } from 'async-validator'
import ValidateSchema from 'async-validator'
import { FIELD_EVENT_NAME } from './event'

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
    })

    this.wt = wt
    this.rid = Row.rid++
    this.columns = columns
    this.parent = parent
    this.rIndex = rIndex
    this.initialData = raw
    this.generate(raw)
    this.trackRowValidateHandle()
  }

  getShallowRaw() {
    let raw: Record<string, any> = {}
    for (const k in this.data) {
      raw[k] = this.data[k].value
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

  private findAll(filter: Filter) {
    const rows: Row[] = []
    walk(this.children, (row) => {
      if (filter(row.getRaw())) {
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
        makeRowProxy(this),
        makeRowAction(this)
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
            makeRowProxy(this),
            makeRowAction(this)
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
            makeRowProxy(this),
            makeRowAction(this)
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
            makeRowProxy(this),
            makeRowAction(this)
          )
        }
      })
  }

  private generate(raw: RowRaw) {
    this.columns.forEach((col) => {
      const cell = Cell.generateBaseCell({
        parent: this,
        colDef: col,
        value: (raw?.[col.field] as CellValue) || this.getDefaultValue(col.default),
        evProxy: this.wt,
      })
      cell.position.field = col.field
      this.data[col.field] = cell
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

  private makeCellAsyncVaidatorFn(colDef: Column, rawRow: RowRaw) {
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
