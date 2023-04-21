import {
  CellErrors,
  CellValue,
  FieldEffectListener,
  RowProxy,
  TableEffectListener,
  TableErrors,
} from './types'

type EventMap = Record<string, (FieldEffectListener | TableEffectListener)[]>
type Events = Record<string, EventMap>
export class EventEmitter {
  constructor(private events: Events = {}, private isPaused = false) {}

  pause() {
    this.isPaused = true
  }

  resume() {
    this.isPaused = false
  }

  on(namespace: string, eventName: string, cb: FieldEffectListener | TableEffectListener) {
    this.events[namespace] = this.events[namespace] || {}
    this.events[namespace][eventName] = this.events[namespace][eventName] || []
    this.events[namespace][eventName].push(cb)
  }

  notifyFieldEvent(
    namespace: string,
    eventName: string,
    val: CellValue,
    row: RowProxy,
    errors?: CellErrors
  ) {
    if (this.events[namespace] && this.events[namespace][eventName]) {
      this.events[namespace][eventName].forEach((cb) => {
        if (!this.isPaused) {
          ;(cb as FieldEffectListener)(val, row, errors)
        }
      })
    }
  }

  notifyTableEvent(namespace: string, eventName: string, errors?: TableErrors) {
    if (this.events[namespace] && this.events[namespace][eventName]) {
      this.events[namespace][eventName].forEach((cb) => {
        if (!this.isPaused) {
          ;(cb as TableEffectListener)(errors)
        }
      })
    }
  }

  off(namespace: string, eventName: string, listener?: FieldEffectListener | TableEffectListener) {
    if (this.events[namespace] && this.events[namespace][eventName]) {
      if (!listener) {
        this.events[namespace][eventName] = []
      } else {
        const cbIndex = this.events[namespace][eventName].findIndex((cb) => cb === listener)
        if (cbIndex > -1) {
          this.events[namespace][eventName].splice(cbIndex, 1)
        }
      }
    }
  }

  offNamespace(namespace: string) {
    if (this.events[namespace]) {
      this.events[namespace] = {}
    }
  }

  offAll() {
    this.events = {}
  }
}
