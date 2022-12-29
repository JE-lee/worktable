import { defineComponent, h, inject } from 'vue-demi'
import { innerDefaultKey } from '@/shared'
import { Worktable, Cell } from '@worktable/core'
import { BaseComponent, Context } from '@/types'
import { observer } from 'mobx-vue'

export const InnerComponentGroup = observer(
  defineComponent({
    name: 'InnerComponentGroup',
    props: {
      cell: {
        type: Object,
        required: true,
      },
      components: {
        type: Array,
        default: () => [],
      },
    },
    setup(props, { attrs }) {
      const { worktable } = inject(innerDefaultKey) as Context
      return () => {
        const cell = props.cell as Cell
        const row = worktable.getRowByRid(cell.position.rid)
        // const rowProxy = makeRawProxy(row!) as unknown as RowRaw
        const components = props.components as BaseComponent[]
        return h(
          'div',
          components.map((com) => {
            const on = com.on
            if (on) {
              for (const eventName in on) {
                const originEvent = on[eventName]
                // on[eventName] = () => {
                //   originEvent({
                //     row: rowProxy,
                //     addRow: () => {
                //       if (row) {
                //         addRow(row)
                //       }
                //     },
                //     removeCurrentRow: () => row && removeRows([row]),
                //   })
                // }
              }
            }
            return h(com.component, { attrs: { ...(com.componentProps || {}) }, on }, [
              (com as any).content as any,
            ])
          })
        )
      }
    },
  }) as any
)
