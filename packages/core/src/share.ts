import { RowAction, RowProxy, ValueType } from './types/schema'
import { isObject, isFunction } from 'lodash-es'
import { RowRaw } from './types'
import { Row } from './Row'

export function getDefaultByValueType(type: ValueType = 'string') {
  if (type === 'boolean') {
    return false
  } else if (type === 'string') {
    return ''
  } else if (type === 'number') {
    return 0
  } else if (type === 'object') {
    return {}
  } else if (type === 'array') {
    return []
  } else {
    return ''
  }
}

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

// TODO: correct type delaretion
export function makeRowProxy(row: Row, immutable = false) {
  const rowDataProxy = makeRowDataProxy(row, immutable)
  const rowAction = makeRowAction(row)
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
        } else if (prop === 'data') {
          return rowDataProxy
        } else if (prop === 'errors') {
          return target.errors
        } else {
          return Reflect.get(rowAction, prop)
        }
      } else {
        return undefined
      }
    },
  }
  return new Proxy(row, handler) as unknown as RowProxy
}

export function makeRowAction(row: Row): RowAction {
  const addRow = row.addRow.bind(row)
  const addRows = row.addRows.bind(row)
  const removeRow = row.remove.bind(row)
  const removeSelf = row.removeSelf.bind(row)
  const removeAllRow = row.removeAll.bind(row)
  const setComponentProps = row.setComponentProps.bind(row)
  const reset = row.reset.bind(row)
  const setValues = row.setValues.bind(row)
  const getValue = row.getRaw.bind(row)

  return {
    reset,
    addRow,
    addRows,
    removeRow,
    removeSelf,
    removeAllRow,
    setComponentProps,
    setValues,
    getValue,
  }
}

function makeRowDataProxy(row: Row, immutable = false) {
  const handler: ProxyHandler<Row> = {
    get(target: Row, prop: string) {
      if (typeof prop === 'string') {
        const cell = target.data[prop]
        return isObject(cell) ? cell.cellValue : target.initialData[prop]
      } else {
        return undefined
      }
    },
  }
  if (!immutable) {
    handler.set = function (target: Row, prop: string, newValue: any) {
      if (typeof prop === 'string') {
        const cell = target.data[prop]
        if (isObject(cell)) {
          cell.setState('value', newValue)
          return true
        } else {
          return Reflect.set(target.initialData, prop, newValue)
        }
      } else {
        return false
      }
    }
  }
  return new Proxy(row, handler) as unknown as RowRaw
}

export function getDefaultValue<T>(_default: T | (() => T)) {
  return isFunction(_default) ? _default() : _default
}
