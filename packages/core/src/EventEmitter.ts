import { EffectListener } from './types'

type EventMap = Record<string, EffectListener[]>
type Events = Record<string, EventMap>
export class EventEmitter {
  constructor(private events: Events = {}) {}

  on(namespace: string, eventName: string, cb: EffectListener) {
    this.events[namespace] = this.events[namespace] || {}
    this.events[namespace][eventName] = this.events[namespace][eventName] || []
    this.events[namespace][eventName].push(cb)
  }

  notify(namespace: string, eventName: string, ...args: any[]) {
    if (this.events[namespace] && this.events[namespace][eventName]) {
      this.events[namespace][eventName].forEach((cb) => cb(...args))
    }
  }

  off(namespace: string, eventName: string, listener?: EffectListener) {
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
