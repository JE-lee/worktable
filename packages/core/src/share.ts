import { isObject } from 'lodash-es'
import { Filter, RowRaw } from './types'
import { Row } from './Row'

export function noop() {
  // empty
}
export function flatten<T extends { children?: T[] }>(array: T[]) {
  const arr: T[] = []
  array.forEach((node) => {
    arr.push(node)
    if (node.children && node.children.length > 0) {
      arr.push(...flatten(node.children))
    }
  })
  return arr
}

export function walk<T extends { children?: T[] }>(
  arrs: T[] | T,
  action: (item: T, index: number) => void
) {
  const targets: T[] = Array.isArray(arrs) ? arrs : [arrs]
  targets.forEach((item, index) => {
    action(item, index)
    if (item.children) {
      walk(item.children, action)
    }
  })
}

export function noThrow<T>(fn: (...args: any[]) => Promise<T>) {
  return (...args: any[]) => {
    return fn(...args).catch(noop)
  }
}

export function makeRowProxy(row: Row, immutable = false): RowRaw {
  const handler: ProxyHandler<Row> = {
    get(target: Row, prop: string) {
      if (typeof prop === 'string') {
        if (prop === 'parent') {
          return row.parent ? makeRowProxy(row.parent, immutable) : null
        } else if (prop === 'children') {
          return row.children.map((r) => makeRowProxy(r, immutable))
        } else if (prop === 'index') {
          return target.rIndex
        } else if (prop === 'rid') {
          return target.rid
        } else {
          const cell = target.data[prop]
          return isObject(cell) ? cell.value : target.initialData[prop]
        }
      } else {
        return Reflect.get(target, prop)
      }
    },
  }
  if (!immutable) {
    handler.set = function (target: Row, prop: string, newValue: any) {
      if (typeof prop === 'string') {
        const cell = target.data[prop]
        return isObject(cell)
          ? Reflect.set(cell, 'value', newValue)
          : Reflect.set(target.initialData, prop, newValue)
      } else {
        return false
      }
    }
  }
  return new Proxy(row, handler) as unknown as RowRaw
}

export function makeRowAction(row: Row) {
  const addRow = row.addRow.bind(row)
  const addRows = row.addRows.bind(row)
  const removeRow = row.remove.bind(row)
  const removeSelf = row.removeSelf.bind(row)
  const removeAllRow = row.removeAll.bind(row)

  return {
    addRow,
    addRows,
    removeRow,
    removeSelf,
    removeAllRow,
  }
}
