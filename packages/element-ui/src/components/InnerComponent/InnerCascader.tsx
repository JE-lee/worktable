import { defineComponent, h, computed } from 'vue-demi'
import { Cascader as ElCascader } from 'element-ui'
import { isFunction } from 'lodash-es'
import { flatten } from '@element-ui/shared'
import type { Listener, VueComponent } from '@element-ui/types'

export const InnerCascader: VueComponent = defineComponent({
  name: 'InnerCascader',
  props: {
    options: {
      type: Array,
      default: () => [],
    },
    optionInValue: Boolean,
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
      const originInput = listeners.input
      const makeEvent = (originEvent: Listener) => {
        return (val: any[]) => {
          if (props.optionInValue) {
            const map: Record<string, any> = {}
            flatten(props.options as any[]).forEach((option) => {
              map[option[props.valueProp]] = option
            })
            val = val.map((v) => map[v])
          }
          const listeners = Array.isArray(originEvent) ? originEvent : [originEvent]
          listeners.forEach((cb) => {
            isFunction(cb) && cb(val)
          })
        }
      }
      return {
        ...listeners,
        change: makeEvent(originChange as any),
        input: makeEvent(originInput as any),
      }
    })

    const value = computed(() => {
      if (props.optionInValue) {
        return props.value.map((val: any) => val?.[props.valueProp])
      } else {
        return props.value
      }
    })

    return () => {
      return h(ElCascader, {
        attrs: Object.assign({}, attrs, props, {
          value: value.value,
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
