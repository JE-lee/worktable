import { FIELD_EVENT_NAME, TABLE_EFFECT_NAMESPACE, TABLE_EVENT_NAME } from './event'
import { CellPosition, RowRaw } from './types/schema'
import { CellState, CellValue, Column, CellFactoryContext, StaticComponentProps } from './types'
import { isUndefined, isEqual, cloneDeep, isFunction } from 'lodash-es'
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

    // FIXME: nextTick
    Promise.resolve().then(() => {
      const field = this.colDef.field
      const rowProxy = makeRowProxy(this.parent)
      const rowAction = makeRowAction(this.parent)
      this.evProxy?.notify(
        field,
        FIELD_EVENT_NAME.ON_FIELD_VALUE_CHANGE,
        cloneDeep(this.value),
        rowProxy,
        rowAction
      )
      this.evProxy?.notify(
        TABLE_EFFECT_NAMESPACE,
        TABLE_EVENT_NAME.ON_FIELD_VALUE_CHANGE,
        this.value,
        rowProxy,
        rowAction
      )
      if (isFunction(this.colDef.value)) {
        this.track((row: RowRaw) => this.setState('value', this.colDef.value!(row)))
      }
    })
  }

  setState(state: CellState, val: any) {
    const prev = this[state]
    this[state] = val
    if (state === 'value' && !isEqual(prev, val)) {
      const field = this.colDef.field
      const rowProxy = makeRowProxy(this.parent)
      const rowAction = makeRowAction(this.parent)
      const copiedVal = cloneDeep(val)
      this.evProxy?.notify(
        field,
        FIELD_EVENT_NAME.ON_FIELD_VALUE_CHANGE,
        copiedVal,
        rowProxy,
        rowAction
      )
      this.evProxy?.notify(
        TABLE_EFFECT_NAMESPACE,
        TABLE_EVENT_NAME.ON_FIELD_VALUE_CHANGE,
        copiedVal,
        rowProxy,
        rowAction
      )
    }
  }

  setComponentProps(extralProps: StaticComponentProps) {
    this.staticComponentProps = Object.assign({}, this.staticComponentProps, extralProps)
  }

  track(reactor: (row: RowRaw) => void) {
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
