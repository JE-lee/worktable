import { isObject } from 'lodash-es'
import { RowRaw } from './types'
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

// TODO: extract this function to a shared module
export function makeRowProxy(row: Row): RowRaw {
  return new Proxy(row, {
    get(target: Row, prop: string) {
      if (typeof prop === 'string') {
        if (prop === 'parent') {
          return row.parent ? makeRowProxy(row.parent) : null
        } else if (prop === 'index') {
          return target.rIndex
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
        return isObject(cell)
          ? Reflect.set(cell, 'value', newValue)
          : Reflect.set(target.initialData, prop, newValue)
      } else {
        return false
      }
    },
  }) as unknown as RowRaw
}
