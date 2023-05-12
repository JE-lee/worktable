import { defineComponent, h } from 'vue-demi'
import type { VueComponent } from '@element-ui/types'
export const InnerRawText: VueComponent = defineComponent({
  name: 'InnerRawText',
  props: {
    text: null,
  },
  setup(props, { attrs }) {
    return () => h('span', { attrs }, String(props.text))
  },
})
