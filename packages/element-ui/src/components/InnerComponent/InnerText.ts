import { defineComponent, h } from 'vue-demi'
import { Cell } from '@worktable/core'
import { observer } from 'mobx-vue'
export const InnerText = observer(
  defineComponent({
    name: 'InnerText',
    props: {
      cell: {
        type: Object,
        required: true,
      },
    },
    setup(props) {
      return () => {
        const cell = props.cell as Cell
        return h('span', cell.value as string)
      }
    },
  }) as any
)
