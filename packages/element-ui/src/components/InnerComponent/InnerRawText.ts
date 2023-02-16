import { defineComponent, h } from 'vue-demi'
export const InnerRawText = defineComponent({
  name: 'InnerRawText',
  props: {
    text: null,
  },
  setup(props) {
    return () => h('span', String(props.text))
  },
})
