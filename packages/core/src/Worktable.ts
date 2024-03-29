import {
  Column,
  CellValue,
  WorktableConstructorOpt,
  CellPosition,
  RowRaws,
  Filter,
  RowRaw,
  FieldEffectListener,
  StaticComponentProps,
  RowProxy,
  TableEffectListener,
} from './types'
import { cloneDeep, isObject, isFunction, isEmpty } from 'lodash-es'
import { BaseWorktable } from './BaseWorktable'
import { runInAction, makeObservable, observable, action } from 'mobx'
import { Row } from './Row'
import { flatten, makeRowProxy, walk } from './share'
import { FIELD_EVENT_NAME, TABLE_EFFECT_NAMESPACE, TABLE_EVENT_NAME } from './event'
import { deconstruct } from './field-parser'

type TableEventForCell =
  | TABLE_EVENT_NAME.ON_FIELD_INPUT_VALUE_CHANGE
  | TABLE_EVENT_NAME.ON_FIELD_VALUE_CHANGE

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

  setData(rows: RowRaw | RowRaw[]) {
    this.removeAll()
    this.add(rows)
  }

  setValuesInEach(raw: (row: RowProxy) => Record<string, any>, filter?: Filter): void
  setValuesInEach(raw: Record<string, any>, filter?: Filter): void
  setValuesInEach(raw: any, filter?: Filter): void {
    if (!filter) {
      filter = () => true
    }
    const rows = this.findAllRows(filter)
    rows.forEach((row) => {
      if (isFunction(raw)) {
        row.setValues(raw(makeRowProxy(row, true)))
      } else {
        row.setValues(raw)
      }
    })
  }

  removeRow(row: Row) {
    let workRows = this.rows
    if (row.parent) {
      workRows = row.parent.children
    }

    const index = workRows.findIndex((r) => r === row)
    if (index > -1) {
      const [removed] = workRows.splice(index, 1)
      this.updateRowsMap()
      removed.teardown()
      // reset row.rIndex
      workRows.forEach((row, index) => (row.rIndex = index))
    }
  }

  remove(rid: number): void
  remove(filter: Filter): void
  remove(filter: any): void {
    const rows: Row[] = []
    if (isFunction(filter)) {
      rows.push(...this.findAllRows(filter as Filter))
    } else {
      const row = this.getRowByRid(filter)
      row && rows.push(row)
    }
    rows.forEach((row) => this.removeRow(row))
  }

  // 删除所有行数据
  removeAll() {
    this.rows = []
    this.updateRowsMap()
    this.teardownAllReactions()
  }

  sort(comparator: (a: RowProxy, b: RowProxy) => number) {
    this.rows.sort((arow, brow) => comparator(makeRowProxy(arow, true), makeRowProxy(brow, true)))
  }

  sortChildInEach(comparator: (a: RowProxy, b: RowProxy) => number, filter: Filter) {
    const rows = this.findAllRows(filter)
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

  add(raw: void): RowProxy
  add(raw: RowRaw): RowProxy
  add(raw: RowRaw[]): RowProxy[]
  add(raw: RowRaw | RowRaw[]): RowProxy | RowProxy[]
  add(raw: any) {
    if (Array.isArray(raw)) {
      return this.addRows(raw)
    } else {
      return this.addRow(raw)
    }
  }

  addRow(raw: RowRaw = {}): RowProxy {
    const row = new Row(this.columns, raw, undefined, this.rows.length, this)
    this.rows.push(row)
    this.updateRowsMap()
    return makeRowProxy(row)
  }

  addRows(raws: RowRaws): RowProxy[] {
    const rows: RowProxy[] = []
    raws.forEach((raw) => {
      rows.push(this.addRow(raw))
    })
    return rows
  }

  findAll(filter?: Filter) {
    return this.findAllRows(filter).map((row) => makeRowProxy(row))
  }

  filter(filter: Filter) {
    return this.findAll(filter)
  }

  find(filter: Filter): RowProxy | null {
    return this.findAll(filter)[0] || null
  }

  forEach(processor: (row: RowProxy) => void) {
    this.walk(processor)
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

  addEffect<T extends TABLE_EVENT_NAME>(
    eventName: T,
    listener: T extends TableEventForCell ? FieldEffectListener : TableEffectListener
  ) {
    this.on(TABLE_EFFECT_NAMESPACE, eventName, listener)
    return () => this.off(TABLE_EFFECT_NAMESPACE, eventName, listener)
  }

  addFieldEffect(field: string, eventName: FIELD_EVENT_NAME, listener: FieldEffectListener) {
    this.on(field, eventName, listener)
    return () => this.off(field, eventName, listener)
  }

  removeFieldEffect(field: string, eventName?: FIELD_EVENT_NAME, listener?: FieldEffectListener) {
    const eventNames: FIELD_EVENT_NAME[] = []
    if (!eventName) {
      eventNames.push(...Object.values(FIELD_EVENT_NAME))
    } else {
      eventNames.push(eventName)
    }
    eventNames.forEach((eventName) => {
      this.off(field, eventName, listener)
    })
  }

  removeEffect(eventName: TABLE_EVENT_NAME, listener?: FieldEffectListener) {
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

  walk(processor: (row: RowProxy) => void) {
    walk(this.rows, (row) => processor(makeRowProxy(row)))
  }

  submit() {
    return this.validate()
  }

  toggleColumnVisibility(fields: string | string[], visible = false) {
    fields = Array.isArray(fields) ? fields : [fields]
    const columns = [...this.columns]
    columns.forEach((colDef) => {
      if ((fields as string[]).some((field) => field === colDef.field)) {
        colDef.hidden = !visible
      }
    })
    this.columns = columns
  }

  teardown() {
    this.removeAll()
    this.offAll() // clear all event listeners
  }

  private findAllRows(filter: Filter = () => true) {
    const rows: Row[] = []
    walk(this.rows, (row) => {
      if (filter(makeRowProxy(row, true))) {
        rows.push(row)
      }
    })
    return rows
  }

  private _setColumns(columns: Column[]) {
    const cols = cloneDeep(columns.filter((col) => isObject(col) && !isEmpty(col)))
    // deconstruct column field
    const appendCols: Column[] = []
    cols.forEach((colDef) => {
      appendCols.push(...(this.tryDeconstructField(colDef) || []))
    })
    appendCols.forEach((appended) => {
      if (cols.some((col) => col.field === appended.field)) {
        return
      }
      cols.push(appended)
    })

    // remove all effect event listeners of field
    this.removeAllColFieldEffects()
    runInAction(() => (this.columns = cols))

    cols.forEach((colDef) => {
      // format enum
      if (!Array.isArray(colDef.enum)) {
        colDef.enum = []
      }
      // init effect event listener of every field
      if (isObject(colDef.effects)) {
        Object.entries(colDef.effects).forEach(([eventName, listener]) => {
          if (isFunction(listener)) {
            this.on(colDef.field, eventName, listener)
          }
        })
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

  // remove all of field effects adding in 'Column'
  private removeAllColFieldEffects() {
    this.columns.forEach((colDef) => {
      if (isObject(colDef.effects)) {
        Object.entries(colDef.effects).forEach(([eventName, listener]) => {
          if (isFunction(listener)) {
            this.off(colDef.field, eventName, listener)
          }
        })
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
      // add: action,
      removeAll: action,
      removeRow: action,
      // updateColumn: action,
      inputValue: action,
      setComponentProps: action,
      sort: action,
      toggleColumnVisibility: action,
    })
  }
}
