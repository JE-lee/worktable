import { EVENT_NAME } from './event'
import { CellPosition } from './types/schema'
import { CellState, CellValue, Column, CellFactoryContext } from './types'
import { isUndefined, isEqual } from 'lodash-es'
import { makeObservable, observable, runInAction } from 'mobx'
import { EventEmitter } from './EventEmitter'
import { Row } from './Row'
import { makeRowProxy } from './share'

// TODO: getter of previweing and validating
export class Cell {
  parent: Row
  value: CellValue
  previewing = true
  validating = false
  errors: string[] = []
  position: CellPosition
  colDef: Column
  evProxy: EventEmitter

  static generateBaseCell(ctx: CellFactoryContext) {
    const { value, colDef, parent, evProxy } = ctx
    const formatedValue = isUndefined(value) ? '' : value // TODO: infer default value from it's type
    return new Cell(parent, colDef, formatedValue, evProxy)
  }

  private constructor(parent: Row, colDef: Column, value: CellValue, ev: EventEmitter) {
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

    this.evProxy.notify(
      this.colDef.field,
      EVENT_NAME.ON_FIELD_VALUE_CHANGE,
      this.value,
      makeRowProxy(this.parent)
    )
  }

  setState(state: CellState, val: any) {
    runInAction(() => {
      const prev = this[state]
      this[state] = val
      if (state === 'value' && !isEqual(prev, val)) {
        this.evProxy.notify(
          this.colDef.field,
          EVENT_NAME.ON_FIELD_VALUE_CHANGE,
          val,
          makeRowProxy(this.parent)
        )
      }
    })
  }
}
