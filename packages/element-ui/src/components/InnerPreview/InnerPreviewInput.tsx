import { defineComponent, h } from 'vue-demi'
export const InnerPreviewInput = defineComponent({
  name: 'InnerPreview',
  props: {
    value: [String, Number],
    size: {
      type: String,
      default: 'default',
    },
  },
  setup(props, { attrs }) {
    return () =>
      h(
        'div',
        {
          staticClass: `el-input el-input--${props.size}`,
          class: attrs.disabled ? 'is-disabled' : '',
        },
        [
          h(
            'div',
            {
              staticClass: 'el-input__inner',
              staticStyle: {
                overflow: 'hidden',
                whiteSpace: 'break-spaces',
                verticalAlign: 'middle',
              },
            },
            props.value as string
          ),
        ]
      )
  },
})
