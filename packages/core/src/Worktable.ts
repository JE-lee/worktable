import { Column, CellValue, WorktableConstructorOpt, CellPosition, RowRaws } from './types'
import { cloneDeep, isObject } from 'lodash-es'
import { BaseWorktable } from './BaseWorktable'
import { runInAction, makeObservable, observable, action } from 'mobx'
import { Row } from './Row'
import { flatten } from './share'
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

    this.clearAll()
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

  clearAll() {
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
      clearAll: action,
    })
  }
}
