import { flatten } from './share'
import { CellPosition, Column, RowRaws, TableErrors } from './types'
import type { Row } from './Row'
import { EventEmitter } from './EventEmitter'
import { TABLE_EVENT_NAME } from './event'
import { mapValues } from 'lodash-es'
import { shallowRef, type ShallowRef } from 'vue'

/**
 * Worktable 基类：维护行数据、rid 索引与校验流程。
 * 事件能力通过组合 EventEmitter 提供（而非历史上的多层的继承），
 * 子类 Worktable 暴露语义化的 addEffect/addFieldEffect 等方法。
 *
 * rows / columns 用 shallowRef 持有（浅监听，避免深度劫持行数据），
 * 通过 getter/setter 暴露普通数组的读写方式，与 mobx 版本 API 一致。
 */
export class BaseWorktable {
  rowsMap: Record<string, Row> = {}

  protected emitter = new EventEmitter()

  private _columns: ShallowRef<Column[]> = shallowRef([])
  private _rows: ShallowRef<Row[]> = shallowRef([])

  get columns(): Column[] {
    return this._columns.value
  }
  set columns(val: Column[]) {
    this._columns.value = val
  }

  get rows(): Row[] {
    return this._rows.value
  }
  set rows(val: Row[]) {
    this._rows.value = val
  }

  protected getRaws() {
    return this.rows.map((row) => row.getRaw())
  }

  public getRowByRid(rid: string | number) {
    return this.rowsMap[rid]
  }

  public getCell(pos: CellPosition) {
    return this.rowsMap[pos.rid]?.data[pos.field]
  }

  public updateRowsMap() {
    const rowsMap: Record<string, Row> = {}
    flatten(this.rows).forEach((row) => {
      rowsMap[row.rid] = row
    })
    this.rowsMap = rowsMap
  }

  // ---------- 事件桥接（供内部 Row/Cell 以及子类使用） ----------
  public notifyFieldEvent: EventEmitter['notifyFieldEvent'] = (
    field,
    eventName,
    val,
    row,
    errors
  ) => this.emitter.notifyFieldEvent(field, eventName, val, row, errors)

  public notifyTableFieldEvent: EventEmitter['notifyTableFieldEvent'] = (
    eventName,
    val,
    row,
    errors
  ) => this.emitter.notifyTableFieldEvent(eventName, val, row, errors)

  public pauseEffects() {
    this.emitter.pause()
  }

  public resumeEffects() {
    this.emitter.resume()
  }

  // ---------- 校验 ----------
  validate(): Promise<RowRaws> {
    this.emitter.notifyTableEvent(TABLE_EVENT_NAME.ON_VALIDATE_START)
    return this.validateAll()
      .then(() => {
        this.emitter.notifyTableEvent(TABLE_EVENT_NAME.ON_VALIDATE_SUCCESS)
        return this.getRaws()
      })
      .catch(() => {
        const errors = this.getValidateErrors()
        this.emitter.notifyTableEvent(TABLE_EVENT_NAME.ON_VALIDATE_FAIL, errors)
        // 抛出结构化校验错误，调用方无需再单独调 getValidateErrors
        return Promise.reject(new ValidateError(errors))
      })
      .finally(() => {
        this.emitter.notifyTableEvent(TABLE_EVENT_NAME.ON_VALIDATE_FINISH)
      })
  }

  protected async validateAll() {
    const flatRows = flatten(this.rows)
    let isValid = true
    await Promise.all(
      flatRows.map((row) =>
        row.validate().catch(() => {
          isValid = false
        })
      )
    )
    if (!isValid) {
      throw new Error('validate failed')
    }
  }

  teardownAllReactions() {
    flatten(this.rows).forEach((row) => row.teardown())
  }

  getValidateErrors(): TableErrors {
    return flatten(this.rows).map((row) => mapValues(row.data, (cell) => [...cell.errors]))
  }
}

/** 结构化校验失败错误，errors 字段携带全表校验结果 */
export class ValidateError extends Error {
  constructor(public errors: TableErrors) {
    super('validate failed')
    this.name = 'ValidateError'
  }
}
