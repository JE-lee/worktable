import { isFunction, omit } from 'lodash-es'
import { observable, makeObservable, runInAction, action } from 'mobx'
import { Column, RowRaw, CellValue, RowRaws } from './types'
import { Cell } from './Cell'
import { Worktable } from './Worktable'

export class Row {
  static rid = 1
  rid: number
  data: Record<string, Cell> = {}
  children: Row[] = []
  parent?: Row
  rIndex?: number
  columns: Column[]
  disposers: Array<() => void> = []
  initialData: Record<string, any> = {}
  private wt: Worktable

  static generateRows(columns: Column[], raws: RowRaws, wt: Worktable, parent?: Row) {
    return raws.map((raw, index) => {
      const row = new Row(columns, raw, wt, parent, index)
      return row
    })
  }

  constructor(columns: Column[], raw: RowRaw = {}, wt: Worktable, parent?: Row, rIndex?: number) {
    makeObservable(this, {
      children: observable.shallow,
      addRow: action,
      addRows: action,
    })

    this.wt = wt
    this.rid = Row.rid++
    this.columns = columns
    this.parent = parent
    this.rIndex = rIndex
    this.initialData = raw
    this.generate(raw)
  }

  getShallowRaw() {
    let raw: Record<string, any> = {}
    for (const k in this.data) {
      raw[k] = this.data[k].value
    }
    raw = Object.assign(omit(this.initialData || {}, 'children'), raw)
    return raw
  }

  getRaw() {
    const raw = this.getShallowRaw()
    if (this.children.length > 0) {
      raw.children = this.children.map((child) => child.getRaw())
    }
    return raw
  }

  addRow(raw?: RowRaw) {
    const row = new Row(this.columns, raw, this.wt, this)
    this.children.push(row)
  }

  addRows(raws: RowRaw[] = []) {
    raws.forEach((raw) => this.addRow(raw))
  }

  stopWatchValidation() {
    this.disposers.forEach((disposer) => disposer())
  }

  private generate(raw: RowRaw) {
    this.columns.forEach((col) => {
      const cell = Cell.generateBaseCell({
        parent: this,
        colDef: col,
        value: (raw?.[col.field] as CellValue) || this.getDefaultValue(col.default),
        evProxy: this.wt,
      })
      cell.position.field = col.field
      this.data[col.field] = cell
    })
    if (Array.isArray(raw?.children)) {
      runInAction(() => {
        this.children = Row.generateRows(this.columns, raw!.children!, this.wt, this)
      })
    }
  }
  private getDefaultValue<T>(_default: T | (() => T)) {
    return isFunction(_default) ? _default() : _default
  }
}
