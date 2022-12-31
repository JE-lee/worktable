export type EventCb = (...args: any[]) => void
type EventMap = Record<string, EventCb[]>
type Events = Record<string, EventMap>
export class EventEmitter {
  constructor(private events: Events = {}) {}

  on(namespace: string, eventName: string, cb: EventCb) {
    this.events[namespace] = this.events[namespace] || {}
    this.events[namespace][eventName] = this.events[namespace][eventName] || []
    this.events[namespace][eventName].push(cb)
  }

  notify(namespace: string, eventName: string, ...args: any[]) {
    if (this.events[namespace] && this.events[namespace][eventName]) {
      this.events[namespace][eventName].forEach((cb) => cb(...args))
    }
  }

  off(namespace: string, eventName: string) {
    if (this.events[namespace] && this.events[namespace][eventName]) {
      this.events[namespace][eventName] = []
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
