import { RuleItem } from 'async-validator'
import ValidateSchema from 'async-validator'
import { isBoolean, isFunction, omit, mapValues } from 'lodash-es'
import { flatten, noThrow, makeRowProxy } from './share'
import { Column, RowRaw, Rule } from './types'
import { Reaction } from 'mobx'
import { Row } from './Row'
import { EVENT_NAME } from './event'
import { EventEmitter } from './EventEmitter'
export class Validator extends EventEmitter {
  rows: Row[] = []

  private disposers: Array<() => void> = []

  async validateAll() {
    const flatRows = flatten(this.rows)
    let isValid = true
    await Promise.all(
      flatRows.map((row) =>
        this.validateRow(row).catch(() => {
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

  protected trackRowValidateHandle(row: Row) {
    // TODO: track cell validator
    const validator = noThrow((isFirstTrack: boolean) => this.validateRow(row, isFirstTrack))
    const reaction: Reaction = new Reaction(`${row.rid}-validator`, () =>
      reaction.track(() => validator(false))
    )
    reaction.track(() => validator(true))
    const disposer = () => reaction.dispose()
    this.disposers.push(disposer)
    row.disposers = [disposer]
  }

  protected validateRow(row: Row, isFirstTrack = false) {
    const descriptor = this.makeRowValidateDescriptor(row)
    const rawRow = row.getShallowRaw()
    const validator = new ValidateSchema(descriptor)
    this.setRowValidating(row, true)
    if (!isFirstTrack) {
      this.notifyAllCell(rawRow, EVENT_NAME.ON_FIELD_VALUE_VALIDATE_START)
    }

    const clearCellsError = () => {
      // clear all row errors
      for (const k in row.data) {
        // 性能优化
        if (row.data[k].errors.length > 0) {
          row.data[k].setState('errors', [])
        }
      }
    }
    return validator
      .validate(rawRow)
      .then((res) => {
        clearCellsError()
        if (!isFirstTrack) {
          this.notifyAllCell(rawRow, EVENT_NAME.ON_FIELD_VALUE_VALIDATE_SUCCESS)
        }
        return res
      })
      .catch((err) => {
        if (!isFirstTrack) {
          clearCellsError()

          const successFields = new Set(Object.keys(row.data))
          const errors = err.errors || []
          errors.forEach((item: any) => {
            const cell = row.data[item.field]
            const errors = [item.message]
            cell.setState('errors', errors)
            this.notify(
              item.field,
              EVENT_NAME.ON_FIELD_VALUE_VALIDATE_FAIL,
              errors,
              cell.value,
              makeRowProxy(row)
            )

            successFields.delete(item.field)
          })

          successFields.forEach((field) =>
            this.notify(
              field,
              EVENT_NAME.ON_FIELD_VALUE_VALIDATE_SUCCESS,
              row.data[field].value,
              makeRowProxy(row)
            )
          )
        }
        throw err
      })
      .finally(() => {
        this.setRowValidating(row, false)
        if (!isFirstTrack) {
          this.notifyAllCell(rawRow, EVENT_NAME.ON_FIELD_VALUE_VALIDATE_FINISH)
        }
      })
  }

  private notifyAllCell(row: RowRaw, enventName: EVENT_NAME) {
    for (const field in row) {
      this.notify(field, enventName, row[field], row)
    }
  }

  private makeRowValidateDescriptor(row: Row) {
    const descriptor: Record<string, RuleItem> = {}
    const rawRow = makeRowProxy(row)
    const columns = row.columns
    columns.forEach((colDef) => {
      if (colDef.rule) {
        descriptor[colDef.field] = this.getRule(colDef.rule)
        // validator
        if (isFunction(colDef.rule.validator)) {
          Object.assign(descriptor[colDef.field], {
            asyncValidator: this.makeCellAsyncVaidator(colDef, rawRow),
          })
        }
      }
    })
    return descriptor
  }

  private makeCellAsyncVaidator(colDef: Column, rawRow: RowRaw) {
    return async (rule: any, value: any) => {
      if (isFunction(colDef?.rule?.validator)) {
        const success = await colDef?.rule?.validator(value, rawRow)
        if (isBoolean(success) && !success) {
          return Promise.reject(colDef?.rule?.message || 'validate error')
        }
      }
    }
  }

  private getRule(rule: Rule): Omit<Rule, 'transform' | 'asyncValidator' | 'validator'> {
    return omit(rule, ['transform', 'asyncValidator', 'validator'])
  }

  private setRowValidating(row: Row, validating: boolean) {
    Object.keys(row.data).forEach((field) => {
      row.data[field].validating = validating
    })
  }
}
