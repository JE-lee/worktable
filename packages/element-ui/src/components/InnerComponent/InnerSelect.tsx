import { defineComponent, h } from 'vue-demi'
import { Select as ElSelect, Option as ElOption } from 'element-ui'
import { FocusAble } from '@/types'
import { observer } from 'mobx-vue'

const SELECT_REF = 'elSelect'
export const InnerSelect = observer(
  defineComponent({
    props: {
      options: {
        type: Array,
        default: () => [],
      },
      value: null,
    },
    setup(props, { attrs, listeners }) {
      return () =>
        h(
          ElSelect,
          {
            attrs: Object.assign({ value: props.value }, attrs),
            on: listeners,
            ref: SELECT_REF,
          },
          props.options.map((option, index) =>
            h(ElOption, {
              attrs: {
                key: index,
                label: (option as any).label,
                value: (option as any).value,
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
        }
      },
    },
  }) as any
)
