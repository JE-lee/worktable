import { defineComponent, h, computed } from 'vue-demi'
import { Cascader as ElCascader } from 'element-ui'
import { isFunction } from 'lodash-es'
import { flatten } from '@/shared'

export const InnerCascader = defineComponent({
  name: 'InnerCascader',
  props: {
    options: {
      type: Array,
      default: () => [],
    },
    optionInChangeEvent: Boolean,
    labelProp: {
      type: String,
      default: 'label',
    },
    valueProp: {
      type: String,
      default: 'value',
    },
    value: null,
  },
  setup(props, { attrs, listeners }) {
    const _listeners = computed(() => {
      const originChange = listeners.change
      return {
        ...listeners,
        change: (val: any[], ...args: any[]) => {
          if (props.optionInChangeEvent) {
            const map: Record<string, any> = {}
            flatten(props.options as any[]).forEach((option) => {
              map[option[props.valueProp]] = option
            })
            val = val.map((v) => map[v])
          }
          isFunction(originChange) && originChange(val)
        },
      }
    })

    return () => {
      return h(ElCascader, {
        attrs: Object.assign({}, attrs, props, {
          props: Object.assign({}, attrs.props || {}, {
            value: props.valueProp,
            label: props.labelProp,
          }),
        }),
        on: _listeners.value,
      })
    }
  },
})
