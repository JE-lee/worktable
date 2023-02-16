import { defineComponent, h, computed } from 'vue-demi'
import { Select as ElSelect, Option as ElOption } from 'element-ui'
import { FocusAble } from '@/types'
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
          change: (val: any) => {
            if (props.optionInChangeEvent) {
              val = (props.options as any[]).find((option) => option[props.valueProp] === val)
            }
            isFunction(originChange) && originChange(val)
          },
        }
      })
      return () =>
        h(
          ElSelect,
          {
            attrs: Object.assign({ value: props.value }, attrs),
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
