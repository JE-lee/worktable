import { FIELD_EVENT_NAME, TABLE_EFFECT_NAMESPACE, TABLE_EVENT_NAME } from './event'
import { CellPosition } from './types/schema'
import { CellState, CellValue, Column, CellFactoryContext } from './types'
import { isUndefined, isEqual } from 'lodash-es'
import { makeObservable, observable, runInAction } from 'mobx'
import { EventEmitter } from './EventEmitter'
import { Row } from './Row'
import { makeRowProxy, makeRowAction } from './share'

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

  static generateBaseCell(ctx: CellFactoryContext) {
    const { value, colDef, parent, evProxy } = ctx
    const formatedValue = isUndefined(value) ? '' : value // TODO: infer default value from it's type
    return new Cell(parent, colDef, formatedValue, evProxy)
  }

  private constructor(parent: Row, colDef: Column, value: CellValue, ev?: EventEmitter) {
    this.parent = parent
    this.position = { rid: parent.rid, field: colDef.field }
    this.colDef = colDef
    this.evProxy = ev
    this.value = value

    makeObservable(this, {
      value: observable.ref,
      previewing: observable.ref,
      validating: observable.ref,
      errors: observable,
      position: observable,
    })

    const field = this.colDef.field
    const rowProxy = makeRowProxy(this.parent)
    const rowAction = makeRowAction(this.parent)
    this.evProxy?.notify(
      field,
      FIELD_EVENT_NAME.ON_FIELD_VALUE_CHANGE,
      this.value,
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
  }

  setState(state: CellState, val: any) {
    runInAction(() => {
      const prev = this[state]
      this[state] = val
      if (state === 'value' && !isEqual(prev, val)) {
        const field = this.colDef.field
        const rowProxy = makeRowProxy(this.parent)
        const rowAction = makeRowAction(this.parent)
        this.evProxy?.notify(
          field,
          FIELD_EVENT_NAME.ON_FIELD_VALUE_CHANGE,
          val,
          rowProxy,
          rowAction
        )
        this.evProxy?.notify(
          TABLE_EFFECT_NAMESPACE,
          TABLE_EVENT_NAME.ON_FIELD_VALUE_CHANGE,
          val,
          rowProxy,
          rowAction
        )
      }
    })
  }
}
