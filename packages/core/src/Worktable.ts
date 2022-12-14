import { Column, CellValue, WorktableConstructorOpt, CellPosition, RowRaws } from './types'
import { cloneDeep, isObject } from 'lodash-es'
import { BaseWorktable } from './BaseWorktable'
import { runInAction } from 'mobx'
import { Row } from './Row'

export class Worktable extends BaseWorktable {
  constructor(opt: WorktableConstructorOpt)
  constructor(columns: Column[])
  constructor(opt: any) {
    super()
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
    this.trackValidateHandle(row)
    this.rows.push(row)
    return row
  }

  addRows(raws: RowRaws) {
    const rows = Row.generateRows(this.columns, raws)
    const last = this.rows.length
    // fix: rIndex
    rows.forEach((row, index) => {
      row.rIndex = last + index
      this.trackValidateHandle(row)
    })
    this.rows.push(...rows)
  }

  clearAll() {
    this.rows = []
    this.stopWatchValidation()
  }

  inputValue(position: CellPosition, value: CellValue) {
    const { rid, field } = position
    const row = this.getRowByRid(rid)
    if (row) {
      runInAction(() => {
        row.data[field].value = value
      })
      return true
    }
    return false
  }

  private _setColumns(columns: Column[]) {
    this.columns = cloneDeep(columns)
  }
}
