import { inject, reactive, watch } from 'vue-demi'
import type { ComputedRef } from 'vue-demi'
import { isUndefined, isObject } from 'lodash-es'
import type { Cell } from '@edsheet/core'
import type { CellContext } from '../types'

export const CELL_CONTEXT = Symbol('component-context')

export function usePersistentContext<T extends Record<string, any>>(initialCtx: T) {
  const cellContext = inject<ComputedRef<CellContext>>(CELL_CONTEXT)
  const ctx = reactive(makeInjectCtx(cellContext?.value.cell))

  watch(
    () => cellContext?.value.cell,
    (cell) => {
      Object.assign(ctx, makeInjectCtx(cell))
    }
  )

  watch(ctx, (ctx) => {
    if (!cellContext) return
    persistInnerState(cellContext.value.cell, { ...ctx })
  })

  function makeInjectCtx(cell?: Cell) {
    const staticProps = cell?.staticComponentProps || {}
    const injectCtx = {} as T

    Object.entries(initialCtx).forEach(([key, val]) => {
      const _val = !isUndefined(staticProps[key]) ? staticProps[key] : val
      ;(injectCtx as Record<string, unknown>)[key] = _val
    })
    return injectCtx
  }

  return ctx
}

export function persistInnerState(cell: Cell, props: any) {
  if (isObject(props)) {
    cell.setComponentProps(props)
  }
}
