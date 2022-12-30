import { CellPosition } from './types/schema'
import { CellState, CellValue, Column } from './types'
import { isUndefined } from 'lodash-es'
import { makeObservable, observable, runInAction } from 'mobx'

// TODO: getter of previweing and validating
export class Cell {
  value: CellValue
  previewing = true
  validating = false
  errors: string[] = []
  position: CellPosition

  static generateBaseCell(rid: number, colDef: Column, value?: CellValue) {
    value = isUndefined(value) ? '' : value // TODO: infer default value from it's type
    return new Cell({ rid, field: colDef.field }, value)
  }

  private constructor(position: CellPosition, value: CellValue) {
    this.position = position
    this.value = value
    makeObservable(this, {
      value: observable.ref,
      previewing: observable.ref,
      validating: observable.ref,
      errors: observable,
      position: observable,
    })
  }

  setState(state: CellState, val: any) {
    runInAction(() => {
      this[state] = val
    })
  }
}
