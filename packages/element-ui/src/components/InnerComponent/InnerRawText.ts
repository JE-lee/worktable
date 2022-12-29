import { defineComponent, h } from 'vue-demi'
export const InnerRawText = defineComponent({
  name: 'InnerRawText',
  props: {
    text: String,
  },
  setup(props) {
    return () => h('span', props.text as string)
  },
})
