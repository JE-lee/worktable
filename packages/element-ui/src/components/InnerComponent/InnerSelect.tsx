import { defineComponent, h, computed } from 'vue-demi'
import { Select as ElSelect, Option as ElOption } from 'element-ui'
import { FocusAble, Listener } from '@/types'
import { isFunction } from 'lodash-es'

const SELECT_REF = 'elSelect'
export const InnerSelect = defineComponent({
  name: 'InnerSelect',
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
    multiple: Boolean,
    value: null,
  },
  setup(props, { attrs, listeners }) {
    const _listeners = computed(() => {
      const originChange = listeners.change
      const originInput = listeners.input
      const makeEvent = (originEvent: Listener) => {
        return (val: string | number | Array<string | number>) => {
          const listeners = Array.isArray(originEvent) ? originEvent : [originEvent]

          if (props.optionInValue) {
            const vals = Array.isArray(val) ? val : [val]
            const optionVals = vals.map((v) => {
              const option = (props.options as Record<string, any>[]).find(
                (option) => option[props.valueProp] === v
              )
              // AsyncSelect search with optionInValue 模式下
              const optionVal = (Array.isArray(props.value) ? props.value : [props.value]).find(
                (item) => item[props.valueProp] === v
              )
              return option || optionVal || {}
            })

            listeners.forEach((cb) => {
              isFunction(cb) && cb(props.multiple ? optionVals : optionVals[0])
            })
          } else {
            listeners.forEach((cb) => {
              isFunction(cb) && cb(val)
            })
          }
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
        if (props.multiple) {
          return (props.value as Array<Record<string, any>>).map((v) => v?.[props.valueProp])
        } else {
          return props.value?.[props.valueProp]
        }
      } else {
        return props.value
      }
    })

    return () =>
      h(
        ElSelect,
        {
          attrs: Object.assign({ value: value.value }, attrs, { multiple: props.multiple }),
          on: _listeners.value,
          ref: SELECT_REF,
        },
        props.options.map((option) =>
          h(ElOption, {
            key: (option as any)[props.valueProp],
            props: {
              label: (option as any)[props.labelProp],
              value: (option as any)[props.valueProp],
            },
          })
        )
      )
  },
  methods: {
    focus() {
      const instance = this.$refs[SELECT_REF] as FocusAble
      if (instance && instance.focus) {
        instance.focus()
        ;(instance as any).visible = true
      }
    },
  },
})
