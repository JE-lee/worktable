import { defineComponent, h, computed } from 'vue-demi'
import { Select as ElSelect, Option as ElOption } from 'element-ui'
import { FocusAble, Listener } from '@/types'
import { observer } from 'mobx-vue'
import { isFunction } from 'lodash-es'

const SELECT_REF = 'elSelect'
export const InnerSelect = observer(
  defineComponent({
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
      value: null,
    },
    setup(props, { attrs, listeners }) {
      const _listeners = computed(() => {
        const originChange = listeners.change
        const originInput = listeners.input
        const makeEvent = (originEvent: Listener) => {
          return (val: string | number) => {
            if (props.optionInValue) {
              val = (props.options as any[]).find((option) => option[props.valueProp] === val) || {}
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
          return props.value[props.valueProp]
        } else {
          return props.value
        }
      })

      return () =>
        h(
          ElSelect,
          {
            attrs: Object.assign({ value: value.value }, attrs),
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
  }) as any
)
