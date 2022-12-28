import { defineComponent, h } from 'vue-demi'

export const Feedback = defineComponent({
  props: { feedback: String, isError: Boolean },
  setup(props, { slots }) {
    return () => {
      return h('div', { staticClass: props.isError ? 'el-form-item is-error' : '' }, [
        h('div', { staticClass: props.isError ? 'el-form-item__content' : '' }, [
          slots.default?.(),
          h('div', { staticClass: props.isError ? 'el-form-item__error' : '' }, [
            props.feedback as string,
          ]),
        ]),
      ])
    }
  },
})
