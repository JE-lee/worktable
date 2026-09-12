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
import { Row } from './Row'
import { flatten, makeRowProxy, walk, isReservedField } from './share'
import { FIELD_EVENT_NAME, TABLE_EVENT_NAME } from './event'
import { deconstruct } from './field-parser'

type TableEventForCell =
  | TABLE_EVENT_NAME.ON_FIELD_INPUT_VALUE_CHANGE
  | TABLE_EVENT_NAME.ON_FIELD_VALUE_CHANGE

export class Worktable extends BaseWorktable {
  constructor(opt: WorktableConstructorOpt)
  constructor(columns: Column[])
  constructor(opt: WorktableConstructorOpt | Column[]) {
    super()

    let columns: Column[] = []
    let initialData: WorktableConstructorOpt['initialData']
    if (Array.isArray(opt)) {
      columns = opt
    } else if (isObject(opt)) {
      columns = (opt as WorktableConstructorOpt).columns || []
      initialData = (opt as WorktableConstructorOpt).initialData
    }
    this._setColumns(columns)
    if (initialData) {
      this.addRows(initialData)
    }
  }

  setColumns(columns: Column[]) {
    const raws = this.getRaws()

    // 拆解旧行但不立即清空 this.rows（避免中间的空数组态额外触发一次响应式通知），
    // 待新行构建完成后一次性替换（对齐 mobx 版本 setColumns 作为单个 action 的批处理语义）。
    const oldRows = this.rows
    this.removeAllColFieldEffects()
    const cols = this.buildColumns(columns)

    oldRows.forEach((row) => row.teardown())

    const newRows = raws.map((raw, i) => new Row(cols, raw, undefined, i, this))
    this.columns = cols
    this.rows = newRows
    this.updateRowsMap()
    this.bindColumnEffects(cols)
  }

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
      const next = workRows.slice()
      const [removed] = next.splice(index, 1)
      // 先重置 rIndex，再赋值触发响应式通知，
      // 保证 watcher 回调里读到的 rIndex 已是最新值（对齐 mobx action 的批处理边界）。
      next.forEach((row, index) => (row.rIndex = index))
      if (row.parent) {
        row.parent.children = next
      } else {
        this.rows = next
      }
      this.updateRowsMap()
      removed.teardown()
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
    const removed = this.rows
    this.rows = []
    this.updateRowsMap()
    removed.forEach((row) => row.teardown())
  }

  sort(comparator: (a: RowProxy, b: RowProxy) => number) {
    this.rows = this.rows
      .slice()
      .sort((arow, brow) => comparator(makeRowProxy(arow, true), makeRowProxy(brow, true)))
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
    this.rows = [...this.rows, row]
    this.updateRowsMap()
    return makeRowProxy(row)
  }

  addRows(raws: RowRaws): RowProxy[] {
    // 批量构建后一次性赋值 rows，保证只触发一次响应式通知
    // （对齐 mobx 版本 addRows 作为单个 action 的批处理语义）。
    const startIndex = this.rows.length
    const newRows = raws.map(
      (raw, i) => new Row(this.columns, raw, undefined, startIndex + i, this)
    )
    if (newRows.length > 0) {
      this.rows = [...this.rows, ...newRows]
      this.updateRowsMap()
    }
    return newRows.map((row) => makeRowProxy(row))
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

  /**
   * 按 rid 获取行的代理对象（RowProxy）。
   * 与内部使用的 getRowByRid（返回 Row 实例）不同，这是面向使用者的便捷入口。
   */
  getRow(rid: number): RowProxy | null {
    const row = this.getRowByRid(rid)
    return row ? makeRowProxy(row) : null
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
    this.emitter.onTable(eventName, listener)
    return () => this.emitter.offTable(eventName, listener)
  }

  addFieldEffect(field: string, eventName: FIELD_EVENT_NAME, listener: FieldEffectListener) {
    this.emitter.onField(field, eventName, listener)
    return () => this.emitter.offField(field, eventName, listener)
  }

  removeFieldEffect(field: string, eventName?: FIELD_EVENT_NAME, listener?: FieldEffectListener) {
    const eventNames: FIELD_EVENT_NAME[] = []
    if (!eventName) {
      eventNames.push(...Object.values(FIELD_EVENT_NAME))
    } else {
      eventNames.push(eventName)
    }
    eventNames.forEach((eventName) => {
      this.emitter.offField(field, eventName, listener)
    })
  }

  removeEffect(eventName: TABLE_EVENT_NAME, listener?: FieldEffectListener | TableEffectListener) {
    return this.emitter.offTable(eventName, listener)
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
    // 原地修改 colDef.hidden，保持与 cell.colDef 的引用一致（cell 读取的是同一对象），
    // 再以新数组重新赋值触发 columns 的浅响应更新。
    this.columns.forEach((colDef) => {
      if ((fields as string[]).some((field) => field === colDef.field)) {
        colDef.hidden = !visible
      }
    })
    this.columns = this.columns.slice()
  }

  teardown() {
    this.removeAll()
    this.emitter.offAll() // clear all event listeners
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
    const cols = this.buildColumns(columns)
    this.removeAllColFieldEffects()
    this.columns = cols
    this.bindColumnEffects(cols)
  }

  /** 构建列定义：过滤、字段解构展开、保留字撞名告警（纯数据加工，不触碰响应式状态） */
  private buildColumns(columns: Column[]): Column[] {
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

    // 列 field 与 RowProxy 保留字撞名时给出告警（该列在 row.data 上会被保留字遮蔽）
    cols.forEach((col) => {
      if (col.field && isReservedField(col.field)) {
        console.warn(
          `[worktable] column field "${col.field}" conflicts with RowProxy reserved keys, ` +
            `it will be shadowed when accessed via rowProxy.${col.field}`
        )
      }
    })
    return cols
  }

  /** 绑定列上声明的 effects 到字段事件 */
  private bindColumnEffects(cols: Column[]) {
    cols.forEach((colDef) => {
      // format enum
      if (!Array.isArray(colDef.enum)) {
        colDef.enum = []
      }
      // init effect event listener of every field
      if (isObject(colDef.effects)) {
        Object.entries(colDef.effects).forEach(([eventName, listener]) => {
          if (isFunction(listener)) {
            this.emitter.onField(
              colDef.field,
              eventName as FIELD_EVENT_NAME,
              listener as FieldEffectListener
            )
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

      meta.keyMaps.forEach(([, to]) => {
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
            this.emitter.offField(
              colDef.field,
              eventName as FIELD_EVENT_NAME,
              listener as FieldEffectListener
            )
          }
        })
      }
    })
  }
}
