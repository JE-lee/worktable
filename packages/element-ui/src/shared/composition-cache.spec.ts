/// <reference types="jest" />
import { CompositionCache } from './composition-cache'

interface ComponentA {
  name: string
  desc: string
}

interface ComponentB {
  age: number
  address: string
}

const componentA: ComponentA = { name: 'componentA', desc: 'a description' }
const componentB: ComponentB = { age: 20, address: 'an address' }

describe('CompositionCache', () => {
  let compositionCache: CompositionCache<ComponentA | ComponentB>

  beforeEach(() => {
    compositionCache = new CompositionCache()
  })

  describe('set', () => {
    it('should set the value for keys properly', () => {
      compositionCache.set(componentA, componentA)
      const result = compositionCache.get(componentA)
      expect(result).toEqual(componentA)
    })

    it('should set nested value for keys properly', () => {
      compositionCache.set([componentA, componentB], componentB)
      expect(compositionCache.get([componentA, componentB])).toEqual(componentB)
    })
  })

  describe('get', () => {
    it('should return undefined for unknown key', () => {
      expect(compositionCache.get('unknownKey' as any)).toBeUndefined()
    })

    it('should return value for single key', () => {
      compositionCache.set(componentA, componentB)
      expect(compositionCache.get(componentA)).toEqual(componentB)
    })

    it('should return value for nested keys', () => {
      compositionCache.set([componentA, componentB], componentA)
      expect(compositionCache.get([componentA, componentB])).toEqual(componentA)
    })
  })
})
