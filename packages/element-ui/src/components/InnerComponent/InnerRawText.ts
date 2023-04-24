import { defineComponent, h } from 'vue-demi'
export const InnerRawText = defineComponent({
  name: 'InnerRawText',
  props: {
    text: null,
  },
  setup(props, { attrs }) {
    return () => h('span', { attrs }, String(props.text))
  },
})
