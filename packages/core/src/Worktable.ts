import { Column, CellValue, WorktableConstructorOpt, CellPosition, RowRaws, Filter } from './types'
import { cloneDeep, isObject, isFunction } from 'lodash-es'
import { BaseWorktable } from './BaseWorktable'
import { runInAction, makeObservable, observable, action } from 'mobx'
import { Row } from './Row'
import { flatten, walk } from './share'
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

  addRow(raw: Record<string, any> = {}) {
    const row = new Row(this.columns, raw, undefined, this.rows.length)
    // collect validate track
    flatten([row]).forEach((row) => this.trackRowValidateHandle(row))
    this.rows.push(row)
    return row
  }

  addRows(raws: RowRaws) {
    const rows = Row.generateRows(this.columns, raws)
    const last = this.rows.length
    // fix: rIndex
    rows.forEach((row, index) => {
      row.rIndex = last + index
    })
    // collect validate track
    flatten(rows).forEach((row) => this.trackRowValidateHandle(row))
    this.rows.push(...rows)
  }

  removeAll() {
    this.rows = []
    this.stopWatchValidation()
  }

  inputValue(position: CellPosition, value: CellValue) {
    const cell = this.getCell(position)
    if (cell) {
      cell.setState('value', value)
      return true
    }
    return false
  }

  findAll(filter: Filter) {
    const rows: Row[] = []
    walk(this.rows, (row) => {
      if (filter(row.getRaw())) {
        rows.push(row)
      }
    })
    return rows
  }

  getCell(pos: CellPosition) {
    return flatten(this.rows).find((r) => r.rid === pos.rid)?.data[pos.field]
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

  removeRow(row: Row) {
    let workRows = this.rows
    if (row.parent) {
      workRows = row.parent.children
    }

    const index = workRows.findIndex((r) => r === row)
    if (index > -1) {
      const [removed] = workRows.splice(index, 1)
      removed.stopWatchValidation()
      row.disposers = []
      // reset row.rIndex
      workRows.forEach((row, index) => (row.rIndex = index))
    }
  }

  private _setColumns(columns: Column[]) {
    runInAction(() => (this.columns = cloneDeep(columns)))
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
