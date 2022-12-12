import { RuleItem } from 'async-validator'
import ValidateSchema from 'async-validator'
import { isBoolean, isFunction, omit, mapValues } from 'lodash-es'
import { BaseWorktable } from './BaseWorktable'
import { flatten, noThrow } from './share'
import { Column, Row, RowRaw, Rule } from './types'
import { autorun } from 'mobx'
export class Validator extends BaseWorktable {
  isTracking = false
  disposers: Array<ReturnType<typeof autorun>> = []

  async validate() {
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
      return this.getRaws()
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

  protected trackValidateHandle(row: Row) {
    this.isTracking = true
    const disposer = autorun(noThrow(() => this.validateRow(row)))
    this.disposers.push(disposer)
    this.isTracking = false
  }

  private validateRow(row: Row) {
    const descriptor = this.makeRowValidateDescriptor(row)
    const rawRow = this.getRaw(row)
    const validator = new ValidateSchema(descriptor)
    this.setRowValidating(row, true)
    return validator
      .validate(rawRow)
      .then((res) => {
        if (!this.isTracking) {
          // clear all row errors
          for (const k in row.data) {
            // 性能优化
            if (row.data[k].errors.length > 0) {
              row.data[k].errors = []
            }
          }
        }
        return res
      })
      .catch((err) => {
        if (!this.isTracking) {
          const errors = err.errors || []
          errors.forEach((item: any) => {
            const cell = row.data[item.field]
            cell.errors = [item.message]
          })
        }
        throw err
      })
      .finally(() => this.setRowValidating(row, false))
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

  private getRule(rule: Rule): Omit<Rule, 'transform' | 'asyncValidator' | 'validator'> {
    return omit(rule, ['transform', 'asyncValidator', 'validator'])
  }

  private setRowValidating(row: Row, validating: boolean) {
    Object.keys(row.data).forEach((field) => {
      row.data[field].validating = validating
    })
  }
}
