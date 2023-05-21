type Component = object
type Key<T> = T | 'self'
type Keys<T> = Array<T> | T
type Value<T> = T | Map<Key<T>, Value<T>>

export class CompositionCache<T extends Component> {
  private store: Map<Key<T>, Value<T>> = new Map()

  set(keys: Keys<T>, value: T) {
    if (!Array.isArray(keys)) {
      keys = [keys]
    }

    let map = this.store
    for (const key of keys) {
      const next = new Map<Key<T>, Value<T>>()
      map.set(key, next)
      map = next
    }
    map.set('self', value)
  }

  get(keys: Keys<T>): T | undefined {
    if (!Array.isArray(keys)) {
      keys = [keys]
    }

    let map = this.store
    keys = [...keys]

    for (const key of keys) {
      const val = map.get(key)
      if (!val) {
        return
      }
      map = val as Map<Key<T>, Value<T>>
    }

    return map.get('self') as T | undefined
  }
}
