import {
  Column,
  CellValue,
  WorktableConstructorOpt,
  CellPosition,
  RowRaws,
  Filter,
  RowRaw,
} from './types'
import { cloneDeep, isObject, isFunction } from 'lodash-es'
import { BaseWorktable } from './BaseWorktable'
import { runInAction, makeObservable, observable, action } from 'mobx'
import { Row } from './Row'
import { flatten, makeRowProxy, walk } from './share'
import { EVENT_NAME } from './event'
export class Worktable extends BaseWorktable {
  constructor(opt: WorktableConstructorOpt)
  constructor(columns: Column[])
  constructor(opt: any) {
    super()
    this.makeObservable()

    let columns: Column[] = []
    let initialData: WorktableConstructorOpt['initialData']
    if (Array.isArray(opt)) {
      columns = opt
    } else if (isObject(opt)) {
      columns = (opt as WorktableConstructorOpt).columns
      initialData = (opt as WorktableConstructorOpt).initialData
    }
    this._setColumns(columns)
    if (initialData) {
      this.addRows(initialData)
    }
  }

  setColumns(columns: Column[]) {
    const raws = this.getRaws()

    this.removeAll()
    this._setColumns(columns)
    // re-generate row data
    this.addRows(raws)
  }

  getData() {
    return this.getRaws()
  }

  add(raw: RowRaw | RowRaw[], filter?: Filter) {
    const raws = Array.isArray(raw) ? raw : [raw]
    if (!filter) {
      this.addRows(raws)
    } else {
      const parents = this.findAll(filter)
      parents.forEach((parent) => parent.addRows(raws))
    }
  }

  remove(rid: number): void
  remove(filter: Filter): void
  remove(filter: any): void {
    const rows: Row[] = []
    if (isFunction(filter)) {
      rows.push(...this.findAll(filter as Filter))
    } else {
      const row = this.getRowByRid(filter)
      row && rows.push(row)
    }
    rows.forEach((row) => this.removeRow(row))
  }

  inputValue(position: CellPosition, value: CellValue) {
    const row = this.getRowByRid(position.rid)
    const cell = row?.data[position.field]
    if (cell) {
      cell.setState('value', value)
      this.notify(
        cell.colDef.field,
        EVENT_NAME.ON_FIELD_INPUT_VALUE_CHANGE,
        value,
        makeRowProxy(row)
      )
      return true
    }
    return false
  }

  getCell(pos: CellPosition) {
    return flatten(this.rows).find((r) => r.rid === pos.rid)?.data[pos.field]
  }

  addRow(raw: RowRaw = {}) {
    const row = new Row(this.columns, raw, undefined, this.rows.length, this)
    this.rows.push(row)
    return row
  }

  addRows(raws: RowRaws) {
    raws.forEach((raw) => this.addRow(raw))
  }

  removeAll() {
    this.rows = []
    this.stopWatchValidation()
  }

  findAll(filter: Filter) {
    const rows: Row[] = []
    walk(this.rows, (row) => {
      if (filter(makeRowProxy(row, true))) {
        rows.push(row)
      }
    })
    return rows
  }

  setCellEditable(pos: CellPosition) {
    const flatRows = flatten(this.rows)
    flatRows.forEach((row) => {
      for (const field in row.data) {
        row.data[field].setState('previewing', true)
      }
    })
    this.getCell(pos)?.setState('previewing', false)
  }

  removeRow(row: Row) {
    let workRows = this.rows
    if (row.parent) {
      workRows = row.parent.children
    }

    const index = workRows.findIndex((r) => r === row)
    if (index > -1) {
      const [removed] = workRows.splice(index, 1)
      removed.stopWatchValidation()
      // reset row.rIndex
      workRows.forEach((row, index) => (row.rIndex = index))
    }
  }

  private _setColumns(columns: Column[]) {
    const cols = cloneDeep(columns)
    // remove all event listeners
    this.offAll()
    runInAction(() => (this.columns = cols))

    // init event listener of every field
    cols.forEach((colDef) => {
      if (isObject(colDef.effects)) {
        Object.entries(colDef.effects).forEach(([eventName, listener]) =>
          this.on(colDef.field, eventName, listener)
        )
      }
    })
  }

  private makeObservable() {
    makeObservable(this, {
      columns: observable.shallow,
      rows: observable.shallow,
      setColumns: action,
      addRow: action,
      addRows: action,
      removeAll: action,
      removeRow: action,
    })
  }
}
