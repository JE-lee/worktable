import { FIELD_EVENT_NAME, TABLE_EFFECT_NAMESPACE, TABLE_EVENT_NAME } from './event'
import { CellPosition, RowRaw } from './types/schema'
import { CellState, CellValue, Column, CellFactoryContext, StaticComponentProps } from './types'
import { isUndefined, isEqual, cloneDeep, isFunction, get, set } from 'lodash-es'
import { action, makeObservable, observable, Reaction } from 'mobx'
import { EventEmitter } from './EventEmitter'
import { Row } from './Row'
import { makeRowProxy, makeRowAction, getDefault } from './share'

// TODO: getter of previweing and validating
export class Cell {
  parent: Row
  value: CellValue
  previewing = true
  validating = false
  errors: string[] = []
  position: CellPosition
  colDef: Column
  evProxy?: EventEmitter
  staticComponentProps: StaticComponentProps
  deconstructedType = ''
  deconstructedCells: Record<string, Cell> = {} // deconstructed fields

  static generateBaseCell(ctx: CellFactoryContext) {
    const { value, colDef, parent, evProxy } = ctx
    const formatedValue = isUndefined(value) ? getDefault(colDef.type || 'string') : value // TODO: infer default value from it's type
    return new Cell(parent, colDef, formatedValue, evProxy)
  }

  private constructor(parent: Row, colDef: Column, value: CellValue, ev?: EventEmitter) {
    this.parent = parent
    this.position = { rid: parent.rid, field: colDef.field }
    this.colDef = colDef
    this.evProxy = ev
    this.value = value
    this.staticComponentProps = colDef.componentProps || {}

    makeObservable(this, {
      value: observable.ref,
      previewing: observable.ref,
      validating: observable.ref,
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
      this.track((row: RowRaw) => this.setState('value', this.colDef.value!(row)))
    }
  }

  notifyValueFieldEvent(eventName: FIELD_EVENT_NAME) {
    const val = cloneDeep(this.value)
    const rowProxy = makeRowProxy(this.parent)
    const rowAction = makeRowAction(this.parent)
    this.evProxy?.notify(this.colDef.field, eventName, val, rowProxy, rowAction)
  }

  notifyValueTableEvent(eventName: TABLE_EVENT_NAME) {
    const val = cloneDeep(this.value)
    const rowProxy = makeRowProxy(this.parent)
    const rowAction = makeRowAction(this.parent)
    this.evProxy?.notify(TABLE_EFFECT_NAMESPACE, eventName, val, rowProxy, rowAction)
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

  private track(reactor: (row: RowRaw) => void) {
    const row = this.parent
    const colDef = this.colDef
    const reactionName = `${row.rid}-${colDef.field}-value-tracker`
    const rowProxy = makeRowProxy(row)
    const reaction: Reaction = new Reaction(reactionName, () =>
      reaction.track(() => reactor(rowProxy))
    )
    reaction.track(() => reactor(rowProxy))
  }
}
