import { defineComponent, h } from 'vue-demi'
export const InnerPreviewInput = defineComponent({
  name: 'InnerPreview',
  props: {
    value: [String, Number],
  },
  setup(props, { attrs }) {
    return () =>
      h(
        'div',
        {
          staticClass: 'el-input el-input--medium',
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
