import { Column, CellValue, WorktableConstructorOpt, CellPosition, RowRaws } from './types'
import { cloneDeep, isObject } from 'lodash-es'
import { Validator } from './Validator'
import { runInAction } from 'mobx'

export class Worktable extends Validator {
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
    this._setColumns(columns)
    // re-generate row data
    this.addRows(this.getRaws())
  }

  getData() {
    return this.getRaws()
  }

  addRow(raw?: Record<string, any>) {
    const row = this.generateRow(raw)
    this.trackValidateHandle(row)
    this.rows.push(row)
    return row
  }

  addRows(raws: RowRaws) {
    const rows = this.generateRows(raws)
    // rows.forEach((row) => this.trackValidateHandle(row))
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
