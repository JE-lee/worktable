import {
  CellErrors,
  CellValue,
  FieldEffectListener,
  RowProxy,
  TableEffectListener,
  TableErrors,
} from './types'
import { FIELD_EVENT_NAME, TABLE_EVENT_NAME } from './event'

type FieldListenerMap = Partial<Record<FIELD_EVENT_NAME, FieldEffectListener[]>>
type TableListenerMap = Partial<
  Record<TABLE_EVENT_NAME, Array<FieldEffectListener | TableEffectListener>>
>

/**
 * 事件发射器。
 * 字段级事件（以 field 为命名空间）与表级事件（全表范围）分开存储，
 * 避免历史上用魔法字符串 '__table_effects__' 充当命名空间、与真实 field 撞名的问题。
 */
export class EventEmitter {
  private fieldEvents: Record<string, FieldListenerMap> = {}
  private tableEvents: TableListenerMap = {}
  private isPaused = false

  pause() {
    this.isPaused = true
  }

  resume() {
    this.isPaused = false
  }

  // ---------- field level ----------
  onField(field: string, eventName: FIELD_EVENT_NAME, cb: FieldEffectListener) {
    const bucket = (this.fieldEvents[field] = this.fieldEvents[field] || {})
    const listeners = (bucket[eventName] = bucket[eventName] || [])
    listeners.push(cb)
  }

  offField(field: string, eventName: FIELD_EVENT_NAME, listener?: FieldEffectListener) {
    const listeners = this.fieldEvents[field]?.[eventName]
    if (!listeners) return
    if (!listener) {
      this.fieldEvents[field]![eventName] = []
    } else {
      const idx = listeners.findIndex((cb) => cb === listener)
      if (idx > -1) listeners.splice(idx, 1)
    }
  }

  notifyFieldEvent(
    field: string,
    eventName: FIELD_EVENT_NAME,
    val: CellValue,
    row: RowProxy,
    errors?: CellErrors
  ) {
    if (this.isPaused) return
    this.fieldEvents[field]?.[eventName]?.slice().forEach((cb) => cb(val, row, errors))
  }

  // ---------- table level ----------
  onTable(eventName: TABLE_EVENT_NAME, cb: FieldEffectListener | TableEffectListener) {
    const listeners = (this.tableEvents[eventName] = this.tableEvents[eventName] || [])
    listeners.push(cb)
  }

  offTable(eventName: TABLE_EVENT_NAME, listener?: FieldEffectListener | TableEffectListener) {
    const listeners = this.tableEvents[eventName]
    if (!listeners) return
    if (!listener) {
      this.tableEvents[eventName] = []
    } else {
      const idx = listeners.findIndex((cb) => cb === listener)
      if (idx > -1) listeners.splice(idx, 1)
    }
  }

  /** 表级「字段值变化」事件：携带 val/row 透传给 FieldEffectListener */
  notifyTableFieldEvent(
    eventName: TABLE_EVENT_NAME,
    val: CellValue,
    row: RowProxy,
    errors?: CellErrors
  ) {
    if (this.isPaused) return
    this.tableEvents[eventName]
      ?.slice()
      .forEach((cb) => (cb as FieldEffectListener)(val, row, errors))
  }

  /** 表级「校验流程」事件：携带 errors 透传给 TableEffectListener */
  notifyTableEvent(eventName: TABLE_EVENT_NAME, errors?: TableErrors) {
    if (this.isPaused) return
    this.tableEvents[eventName]?.slice().forEach((cb) => (cb as TableEffectListener)(errors))
  }

  offAll() {
    this.fieldEvents = {}
    this.tableEvents = {}
  }
}
