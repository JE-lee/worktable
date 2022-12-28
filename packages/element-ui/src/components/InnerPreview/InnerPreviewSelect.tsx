import { defineComponent, h } from 'vue-demi'

export const InnerPreviewSelect = defineComponent({
  name: 'InnerPreviewSelect',
  props: {
    value: [String, Number],
  },
  setup(props, { attrs }) {
    return () => {
      let staticClass = 'el-input el-input--medium el-select el-select--medium el-input--suffix'
      if (attrs.disabled) {
        staticClass += ' is-disabled'
      }
      return h('div', { staticClass }, [
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
        // suffix 倒三角
        h('span', { staticClass: 'el-input__suffix' }, [
          h('span', { staticClass: 'el-input__suffix-inner' }, [
            h('i', {
              staticClass: 'el-select__caret el-input__icon el-icon-arrow-down',
            }),
          ]),
        ]),
      ])
    }
  },
})
