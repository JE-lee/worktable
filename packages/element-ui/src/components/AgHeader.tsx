import { Worktable } from '@edsheet/core'
import { VueComponent, UIColumn } from '../types'
import { bindWorktable } from '../shared'

type RenderHeaderParmeter = Parameters<Required<UIColumn>['renderHeader']>[0]

export const AgHeader: VueComponent = {
  name: 'AgHeader',
  render(h: any) {
    // https://www.ag-grid.com/vue-data-grid/component-cell-renderer/#reference-ICellRendererParams
    const params = (this as any).params
    const worktable = params.worktable as Worktable
    const field = params.column.colDef.field
    const col = worktable.columns.find((col) => col.field === field)!

    const ctx: RenderHeaderParmeter = {
      field: col.field,
      add: worktable.addRow.bind(worktable),
      worktable: bindWorktable(worktable),
    }
    const defaultRenderer = () => {
      const required = col.required || col.asterisk
      return h('span', { class: { required } }, col.title)
    }
    const render = params.renderHeader || defaultRenderer

    return render(ctx)
  },
}
