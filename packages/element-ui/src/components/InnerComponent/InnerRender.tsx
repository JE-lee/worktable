import { defineComponent, inject, nextTick } from 'vue-demi'
import { innerDefaultKey } from '@/shared'
import { Cell, makeRowProxy, makeRowAction } from '@worktable/core'
import { Context, RowAction } from '@/types'
import { observer } from 'mobx-vue'
import { isFunction } from 'lodash-es'

export const InnerRender = observer(
  defineComponent({
    name: 'InnerRender',
    props: {
      cell: {
        type: Object,
        required: true,
      },
      render: {
        type: Function,
      },
    },
    setup(props) {
      const { worktable, toggleRowExpansion } = inject(innerDefaultKey) as Context
      const cell = props.cell as Cell
      const row = worktable.getRowByRid(cell.position.rid)
      const rowProxy = makeRowProxy(row!)
      const toggleExpansion = (expanded: boolean) => {
        toggleRowExpansion((row) => row.rid === cell.position.rid, expanded)
      }

      const rowAction: RowAction = {
        ...makeRowAction(row!),
        toggleExpansion,
      }

      return () => {
        const render = props.render
        if (isFunction(render)) {
          return render(rowProxy, rowAction)
        }
      }
    },
  }) as any
)
