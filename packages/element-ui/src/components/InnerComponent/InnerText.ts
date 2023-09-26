import { defineComponent, h } from 'vue-demi'
import type { VueComponent } from '@element-ui/types'
export const InnerText: VueComponent = defineComponent({
  name: 'InnerText',
  props: {
    value: null,
  },
  setup(props, { attrs }) {
    return () => {
      return h('span', { attrs }, props.value as string)
    }
  },
})
