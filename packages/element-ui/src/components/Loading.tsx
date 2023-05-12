import { defineComponent, h } from 'vue-demi'
import type { VueComponent } from '@element-ui/types'

export const Loading: VueComponent = defineComponent({
  name: 'Loading',
  props: {
    loading: Boolean,
  },
  setup(props, { slots }) {
    return () => {
      const loading = props.loading
      return h(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
          },
        },
        [
          h(
            'div',
            {
              style: 'flex: 1',
            },
            slots.default?.()
          ),
          loading &&
            h('i', {
              staticClass: 'el-icon-loading',
            }),
        ]
      )
    }
  },
})
