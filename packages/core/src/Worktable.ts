import {
  Column,
  CellValue,
  WorktableConstructorOpt,
  CellPosition,
  RowRaws,
  Filter,
  RowRaw,
  EffectListener,
  StaticComponentProps,
  RowProxy,
} from './types'
import { cloneDeep, isObject, isFunction } from 'lodash-es'
import { BaseWorktable } from './BaseWorktable'
import { runInAction, makeObservable, observable, action } from 'mobx'
import { Row } from './Row'
import { flatten, makeRowProxy, makeRowAction, walk } from './share'
import { FIELD_EVENT_NAME, TABLE_EFFECT_NAMESPACE, TABLE_EVENT_NAME } from './event'
import { deconstruct } from './field-parser'
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

  // updateColumn(field: string, newCol: Column | ((oldCol: Column) => Column)) {
  //   const colIndex = this.columns.findIndex((col) => col.field === field)

  //   if (colIndex > -1) {
  //     if (isFunction(newCol)) {
  //       newCol = newCol(this.columns[colIndex])
  //     }
  //     const columns = [...this.columns]
  //     columns.splice(colIndex, 1, newCol)
  //   }
  // }

  getData() {
    return this.getRaws()
  }

  setValuesInEach(raw: (row: RowProxy) => Record<string, any>, filter: Filter): void
  setValuesInEach(raw: Record<string, any>, filter: Filter): void
  setValuesInEach(raw: any, filter: Filter): void {
    const rows = this.findAll(filter)
    rows.forEach((row) => {
      if (isFunction(raw)) {
        row.setValues(raw(makeRowProxy(row)))
      } else {
        row.setValues(raw)
      }
    })
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

  sort(comparator: (a: RowProxy, b: RowProxy) => number) {
    this.rows.sort((arow, brow) => comparator(makeRowProxy(arow, true), makeRowProxy(brow, true)))
  }

  sortChildInEach(comparator: (a: RowProxy, b: RowProxy) => number, filter: Filter) {
    const rows = this.findAll(filter)
    rows.forEach((row) => row.sort(comparator))
  }

  inputValue(position: CellPosition, value: CellValue) {
    const row = this.getRowByRid(position.rid)
    const cell = row?.data[position.field]
    if (cell) {
      cell.setState('value', value)
      cell.notifyValueFieldEvent(FIELD_EVENT_NAME.ON_FIELD_INPUT_VALUE_CHANGE)
      cell.notifyValueTableEvent(TABLE_EVENT_NAME.ON_FIELD_INPUT_VALUE_CHANGE)
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

  addEffect(eventName: TABLE_EVENT_NAME, listener: EffectListener) {
    return this.on(TABLE_EFFECT_NAMESPACE, eventName, listener)
  }

  addFieldEffect(feild: string, eventName: FIELD_EVENT_NAME, listener: EffectListener) {
    return this.on(feild, eventName, listener)
  }

  removeEffect(eventName: TABLE_EVENT_NAME, listener?: EffectListener) {
    return this.off(TABLE_EFFECT_NAMESPACE, eventName, listener)
  }

  setComponentProps(field: string, externalProps: StaticComponentProps) {
    flatten(this.rows).forEach((row) => row.setComponentProps(field, externalProps))
    const column = this.columns.find((col) => col.field === field)
    if (column) {
      column.componentProps = column.componentProps || {}
      Object.assign(column.componentProps, externalProps)
    }
  }

  walk(processor: (row: RowProxy, action: ReturnType<typeof makeRowAction>) => void) {
    walk(this.rows, (row) => processor(makeRowProxy(row), makeRowAction(row)))
  }

  private _setColumns(columns: Column[]) {
    const cols = cloneDeep(columns.filter((col) => isObject(col)))
    // deconstruct column field
    const appendCols: Column[] = []
    cols.forEach((colDef) => {
      appendCols.push(...(this.tryDeconstructField(colDef) || []))
    })
    cols.push(...appendCols)

    // remove all effect event listeners of field
    this.removeAllFieldEffects()
    runInAction(() => (this.columns = cols))

    // init effect event listener of every field
    cols.forEach((colDef) => {
      if (isObject(colDef.effects)) {
        Object.entries(colDef.effects).forEach(([eventName, listener]) =>
          this.on(colDef.field, eventName, listener)
        )
      }
    })
  }

  private tryDeconstructField(colDef: Column): Column[] | undefined {
    const meta = deconstruct(colDef.field)
    if (meta) {
      colDef.virtual = true
      const cols: Column[] = []

      meta.keyMaps.forEach(([from, to]) => {
        cols.push({ field: to, hidden: true })
      })
      return cols
    }
  }

  private removeAllFieldEffects() {
    this.columns.forEach((col) => {
      this.offNamespace(col.field)
    })
  }

  private makeObservable() {
    makeObservable(this, {
      columns: observable.shallow,
      rows: observable.shallow,
      setColumns: action,
      addRow: action,
      addRows: action,
      add: action,
      removeAll: action,
      removeRow: action,
      // updateColumn: action,
      inputValue: action,
      setComponentProps: action,
      sort: action,
    })
  }
}
