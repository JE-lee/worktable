import { RuleItem } from 'async-validator'
import ValidateSchema from 'async-validator'
import { isBoolean, isFunction, omit } from 'lodash-es'
import { BaseWorktable } from './BaseWorktable'
import { flatten } from './share'
import { Column, Row, RowRaw, Rule } from './types'
import { autorun } from 'mobx'

export class Validator extends BaseWorktable {
  isTracking = false
  disposers: Array<ReturnType<typeof autorun>> = []

  validate() {
    const flatRows = flatten(this.rows)
    return Promise.all(flatRows.map((row) => this.validateRow(row)))
  }

  stopWatchValidation() {
    this.disposers.forEach((disposer) => disposer())
  }

  protected trackValidateHandle(row: Row) {
    this.isTracking = true
    const disposer = autorun(() => this.validateRow(row))
    this.disposers.push(disposer)
    this.isTracking = false
  }

  private validateRow(row: Row) {
    const descriptor = this.makeRowValidateDescriptor(row)
    const rawRow = this.getRaw(row)
    const validator = new ValidateSchema(descriptor)
    return validator
      .validate(rawRow)
      .then((res) => {
        if (this.isTracking) return
        // clear all row errors
        for (const k in row.data) {
          // 性能优化
          if (row.data[k].errors.length > 0) {
            row.data[k].errors = []
          }
        }
        return res
      })
      .catch((err) => {
        if (this.isTracking) return
        const errors = err.errors || []
        errors.forEach((item: any) => {
          const cell = row.data[item.field]
          cell.errors = [item.message]
        })
        throw err
      })
  }

  private makeRowValidateDescriptor(row: Row) {
    const descriptor: Record<string, RuleItem> = {}
    // TODO: row proxy
    const rawRow = this.getRaw(row)
    this.columns.forEach((colDef) => {
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
    if (colDef?.rule?.validator) {
      return async (rule: any, value: any) => {
        if (isFunction(colDef?.rule?.validator)) {
          const success = await colDef?.rule?.validator({
            row: rawRow,
            value,
          })
          if (isBoolean(success) && !success) {
            return Promise.reject(colDef?.rule?.message || 'validate error')
          }
        }
      }
    }

    return null
  }

  private getRule(rule: Rule): Omit<Rule, 'transform' | 'asyncValidator' | 'validator'> {
    return omit(rule, ['transform', 'asyncValidator', 'validator'])
  }
}
