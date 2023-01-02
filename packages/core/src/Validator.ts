import { mapValues } from 'lodash-es'
import { flatten } from './share'
import { Row } from './Row'
import { EventEmitter } from './EventEmitter'
export class Validator extends EventEmitter {
  rows: Row[] = []

  private disposers: Array<() => void> = []

  async validateAll() {
    const flatRows = flatten(this.rows)
    let isValid = true
    await Promise.all(
      flatRows.map((row) =>
        row.validate().catch((err) => {
          isValid = false
        })
      )
    )
    if (isValid) {
      return Promise.resolve(true)
    } else {
      throw new Error('validate failed')
    }
  }

  stopWatchValidation() {
    this.disposers.forEach((disposer) => disposer())
  }

  getValidateErrors() {
    return flatten(this.rows).map((row) => mapValues(row.data, (cell) => [...cell.errors]))
  }
}
