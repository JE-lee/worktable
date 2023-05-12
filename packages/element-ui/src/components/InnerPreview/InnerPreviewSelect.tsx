import { computed, defineComponent, h } from 'vue-demi'
import type { VueComponent } from '@element-ui/types'

export const InnerPreviewSelect: VueComponent = defineComponent({
  name: 'InnerPreviewSelect',
  props: {
    value: [String, Number],
    size: {
      type: String,
      default: 'default',
    },
    options: {
      type: Array,
      default: () => [],
    },
    labelProp: {
      type: String,
      default: 'label',
    },
    valueProp: {
      type: String,
      default: 'value',
    },
  },
  setup(props, { attrs }) {
    const text = computed(() => {
      const option: any = props.options.find((item: any) => item[props.valueProp] === props.value)
      return option ? option[props.labelProp] : props.value || ''
    })
    return () => {
      let staticClass = `el-input el-input--${props.size} el-select el-select--${props.size} el-input--suffix`
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
          text.value
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
