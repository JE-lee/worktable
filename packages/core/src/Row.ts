import { isFunction, isUndefined, omit } from 'lodash-es'
import { observable, makeObservable, runInAction, action } from 'mobx'
import { Column, RowRaw, Cell, CellValue, RowRaws } from './types'

export class Row {
  static rid = 1
  rid: number
  data: Record<string, Cell> = {}
  children: Row[] = []
  parent?: Row
  rIndex?: number
  columns: Column[]

  private initialData: Record<string, any> = {}

  static generateRows(columns: Column[], raws: RowRaws, parent?: Row) {
    return raws.map((raw, index) => {
      const row = new Row(columns, raw, parent, index)
      return row
    })
  }

  constructor(columns: Column[], raw: RowRaw = {}, parent?: Row, rIndex?: number) {
    makeObservable(this, {
      children: observable.shallow,
      addRow: action,
      addRows: action,
    })

    this.rid = Row.rid++
    this.columns = columns
    this.parent = parent
    this.rIndex = rIndex
    this.initialData = raw
    this.generate(raw)
  }

  getRaw() {
    let raw: Record<string, any> = {}
    for (const k in this.data) {
      raw[k] = this.data[k].value
    }

    raw = Object.assign(omit(this.initialData || {}, 'children'), raw)
    if (this.children.length > 0) {
      raw.children = this.children.map((child) => child.getRaw())
    }
    return raw
  }

  addRow(raw?: RowRaw) {
    const row = new Row(this.columns, raw, this)
    this.children.push(row)
  }

  addRows(raws: RowRaw[] = []) {
    raws.forEach((raw) => this.addRow(raw))
  }

  private generate(raw: RowRaw) {
    this.columns.forEach((col) => {
      const cell = this.generateBaseCell(
        col.field,
        (raw?.[col.field] as CellValue) || this.getDefaultValue(col.default)
      )
      cell.position.field = col.field
      this.data[col.field] = observable(cell)
    })
    if (Array.isArray(raw?.children)) {
      runInAction(() => {
        this.children = Row.generateRows(this.columns, raw!.children!, this)
      })
    }
  }

  private generateBaseCell(field: string, value?: CellValue): Cell {
    return {
      value: isUndefined(value) ? '' : value, // TODO: infer default value from it's type
      previewing: true,
      validating: false,
      errors: [],
      position: {
        rid: this.rid,
        field,
      },
    }
  }
  private getDefaultValue<T>(_default: T | (() => T)) {
    return isFunction(_default) ? _default() : _default
  }
}
