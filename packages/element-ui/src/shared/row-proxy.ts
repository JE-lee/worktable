import { Row, RowRaw } from '@worktable/core'
import { isObject } from 'lodash-es'

export function makeRowProxy(row: Row): RowRaw {
  return new Proxy(row, {
    get(target: Row, prop: string) {
      if (typeof prop === 'string') {
        if (prop === 'parent') {
          return row.parent ? makeRowProxy(row.parent) : null
        } else {
          const cell = target.data[prop]
          return isObject(cell) ? cell.value : cell
        }
      } else {
        return Reflect.get(target, prop)
      }
    },
    set(target: Row, prop: string, newValue: any) {
      if (typeof prop === 'string') {
        const cell = target.data[prop]
        return isObject(cell) ? Reflect.set(cell, 'value', newValue) : false
      } else {
        return false
      }
    },
  }) as unknown as RowRaw
}
