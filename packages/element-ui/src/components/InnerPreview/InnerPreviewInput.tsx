import { defineComponent, h } from 'vue-demi'
import type { VueComponent } from '@element-ui/types'
export const InnerPreviewInput: VueComponent = defineComponent({
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
