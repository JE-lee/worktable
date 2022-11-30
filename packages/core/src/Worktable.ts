import { Column, CellValue, WorktypeConstructorOpt, CellPosition, RowRaws } from './types'
import { cloneDeep, isObject } from 'lodash-es'
import { Validator } from './Validator'

export class Worktable extends Validator {
  constructor(opt: WorktypeConstructorOpt)
  constructor(columns: Column[])
  constructor(opt: any) {
    super()
    let columns: Column[] = []
    let initialData: WorktypeConstructorOpt['initialData']
    if (Array.isArray(opt)) {
      columns = opt
    }
    if (isObject(opt)) {
      columns = (opt as WorktypeConstructorOpt).columns
      initialData = (opt as WorktypeConstructorOpt).initialData
    }
    this.setColumns(columns)
    if (initialData) {
      this.addRows(initialData)
    }
  }

  setColumns(columns: Column[]) {
    this.columns = cloneDeep(columns)
    // re-generate row data
    this.addRows(this.getRaws())
  }

  addRow(raw?: Record<string, any>) {
    const row = this.generateRow(raw)
    this.trackValidateHandle(row)
    this.rows.push(row)
  }

  addRows(raws: RowRaws) {
    const rows = this.generateRows(raws)
    rows.forEach((row) => this.trackValidateHandle(row))
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
      row.data[field].value = value
    }
    return false
  }
}
