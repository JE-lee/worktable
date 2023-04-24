import { defineComponent, h } from 'vue-demi'
import { observer } from 'mobx-vue'
export const InnerText = observer(
  defineComponent({
    name: 'InnerText',
    props: {
      value: null,
    },
    setup(props, { attrs }) {
      return () => {
        return h('span', { attrs }, props.value as string)
      }
    },
  }) as any
)
