import { FIELD_EVENT_NAME, TABLE_EFFECT_NAMESPACE, TABLE_EVENT_NAME } from './event'
import {
  CellState,
  CellValue,
  Column,
  CellFactoryContext,
  StaticComponentProps,
  CellPosition,
  RowProxy,
} from './types'
import { isUndefined, isEqual, cloneDeep, isFunction, get, set } from 'lodash-es'
import { action, makeObservable, observable, Reaction } from 'mobx'
import { EventEmitter } from './EventEmitter'
import { Row } from './Row'
import { makeRowProxy, getDefaultByValueType, getDefaultValue } from './share'

// TODO: getter of previweing and validating
export class Cell {
  parent: Row
  value: CellValue
  previewing = true
  validating = false
  loading = false
  modified = false
  errors: string[] = []
  position: CellPosition
  colDef: Column
  evProxy?: EventEmitter
  staticComponentProps: StaticComponentProps
  deconstructedType = ''
  deconstructedCells: Record<string, Cell> = {} // deconstructed fields

  get cellValue() {
    if (this.colDef.type === 'number') {
      if (typeof this.value === 'string' && this.value.length > 0) {
        return Number(this.value)
      } else {
        return this.value // ''
      }
    } else {
      return this.value
    }
  }

  static generateBaseCell(ctx: CellFactoryContext) {
    const { value, colDef, parent, evProxy } = ctx
    const formatedValue = isUndefined(value)
      ? getDefaultByValueType(colDef.type || 'string')
      : value // TODO: infer default value from it's type
    return new Cell(parent, colDef, formatedValue, evProxy)
  }

  private constructor(parent: Row, colDef: Column, value: CellValue, ev?: EventEmitter) {
    this.parent = parent
    this.position = { rid: parent.rid, field: colDef.field }
    this.colDef = colDef
    this.evProxy = ev
    this.value = value
    this.staticComponentProps = colDef.componentProps ? { ...colDef.componentProps } : {}

    makeObservable(this, {
      value: observable.ref,
      previewing: observable.ref,
      validating: observable.ref,
      loading: observable.ref,
      errors: observable,
      position: observable,
      staticComponentProps: observable.ref,
      setState: action,
      setComponentProps: action,
    })
  }

  setState(state: CellState, val: any) {
    const prev = this[state]
    this[state] = val
    if (state === 'value' && !isEqual(prev, val)) {
      this.modified = true
      this.deconstructValue()
      this.notifyValueFieldEvent(FIELD_EVENT_NAME.ON_FIELD_VALUE_CHANGE)
      this.notifyValueTableEvent(TABLE_EVENT_NAME.ON_FIELD_VALUE_CHANGE)
    }
  }

  setComponentProps(extralProps: StaticComponentProps) {
    this.staticComponentProps = Object.assign({}, this.staticComponentProps, extralProps)
  }

  trackDynamicValue() {
    if (isFunction(this.colDef.value)) {
      this.track((row: RowProxy) => this.setState('value', this.colDef.value!(row)), true)
    }
  }

  setupOnFieldReactEffect() {
    const onFieldReact = this.colDef.effects?.[FIELD_EVENT_NAME.ON_FIELD_REACT]
    if (isFunction(onFieldReact)) {
      this.track((row: RowProxy) => onFieldReact(row))
    }
  }

  notifyValueFieldEvent(eventName: FIELD_EVENT_NAME) {
    const val = cloneDeep(this.cellValue)
    const rowProxy = makeRowProxy(this.parent)
    this.evProxy?.notifyFieldEvent(this.colDef.field, eventName, val, rowProxy)
  }

  notifyValueTableEvent(eventName: TABLE_EVENT_NAME) {
    const val = cloneDeep(this.cellValue)
    const rowProxy = makeRowProxy(this.parent)
    this.evProxy?.notifyFieldEvent(TABLE_EFFECT_NAMESPACE, eventName, val, rowProxy)
  }

  deconstructValue() {
    // set value of deconstructed cells
    Object.entries(this.deconstructedCells).forEach(([from, cell]) => {
      cell.setState('value', get(this.value, from))
    })
  }

  mergeValue() {
    if (this.deconstructedType !== 'object' && this.deconstructedType !== 'array') return this.value
    let merged: object
    if (this.deconstructedType === 'object') {
      merged = {}
    } else {
      merged = []
    }

    Object.entries(this.deconstructedCells).forEach(([from, cell]) => {
      set(merged, from, cell.value)
    })
    return merged as CellValue
  }

  reset() {
    if (!this.deconstructedType) {
      const defaultValue = this.colDef.default
        ? getDefaultValue(this.colDef.default)
        : getDefaultByValueType(this.colDef.type)
      this.setState('value', defaultValue)
    } else {
      Object.values(this.deconstructedCells).forEach((cell) => cell.reset())
      this.setState('value', this.mergeValue())
    }
  }

  private track(reactor: (row: RowProxy) => void, rowImmutable = false) {
    const row = this.parent
    const colDef = this.colDef
    const reactionName = `${row.rid}-${colDef.field}-value-tracker`
    const rowProxy = makeRowProxy(row, rowImmutable)
    const reaction: Reaction = new Reaction(reactionName, () =>
      reaction.track(() => reactor(rowProxy))
    )
    reaction.track(() => reactor(rowProxy))
  }
}
