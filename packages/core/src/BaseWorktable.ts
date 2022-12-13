import { flatten, isFunction, isUndefined, omit } from 'lodash-es'
import { observable } from 'mobx'
import { Cell, CellValue, Column, Row, RowRaw, RowRaws, Rows } from './types'

export class BaseWorktable {
  static rid = 1
  protected columns: Column[] = []
  protected rows: Rows = []

  protected getRaws() {
    return this.rows.map((row) => this.getRaw(row))
  }

  protected getRaw(row: Row) {
    let raw: Record<string, any> = {}
    for (const k in row.data) {
      raw[k] = row.data[k].value
    }

    raw = Object.assign(omit(row.initialData || {}, 'children'), raw)
    if (row.children.length > 0) {
      raw.children = row.children.map((child) => this.getRaw(child))
    }
    return raw
  }

  protected getRowByRid(rid: string | number) {
    return flatten(this.rows).find((row) => row.rid == rid)
  }

  protected generateRows(raws: RowRaws, parent?: Row) {
    return raws.map((raw, index) => {
      const row = this.generateRow(raw, parent)
      row.rIndex = index
      return row
    })
  }

  protected generateRow(raw?: RowRaw, parent?: Row) {
    const rid = BaseWorktable.rid++
    const row: Row = {
      rid,
      data: {},
      initialData: raw,
      parent,
      children: [],
      rIndex: -1,
    }
    this.columns.forEach((col) => {
      const cell = this.generateBaseCell(
        rid,
        (raw?.[col.field] as CellValue) || this.getDefaultValue(col.default)
      )
      cell.position.field = col.field
      row.data[col.field] = observable(cell)
    })
    if (Array.isArray(raw?.children)) {
      row.children = this.generateRows(raw!.children, row)
    }
    return row
  }

  protected generateBaseCell(rid: number, value?: CellValue): Cell {
    return {
      value: isUndefined(value) ? '' : value, // TODO: infer default value from it's type
      previewing: true,
      validating: false,
      errors: [],
      position: {
        rid,
        field: '',
      },
    }
  }

  protected getDefaultValue<T>(_default: T | (() => T)) {
    return isFunction(_default) ? _default() : _default
  }
}
