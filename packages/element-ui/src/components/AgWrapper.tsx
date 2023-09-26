import { VueComponent } from '../types'
import type { Worktable } from '@edsheet/core'
import { splitPosKey } from '../shared'
import { TableCell } from '../components/TableCell'

export const AgWrapper: VueComponent = {
  name: 'AgWrapper',
  render(h: any) {
    // https://www.ag-grid.com/vue-data-grid/component-cell-renderer/#reference-ICellRendererParams
    const params = (this as any).params
    const value = params.value as string
    const worktable = params.worktable as Worktable

    const [rid, field] = splitPosKey(value)
    const pos = { rid, field }
    const cell = worktable.getCell(pos)

    return h(TableCell, {
      attrs: {
        cell,
        colDef: cell.colDef,
      },
    })
  },
}
