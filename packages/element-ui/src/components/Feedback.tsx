import { defineComponent, h, inject } from 'vue-demi'
import { innerDefaultKey, CLASS_PREFIX } from '@/shared'
import { Context } from '@/types'

export const Feedback = defineComponent({
  name: 'Feedback',
  props: { feedback: String, isError: Boolean },
  setup(props, { slots }) {
    const { layout } = inject(innerDefaultKey) as Context
    const isPopover = layout.feedback === 'popover'
    return () => {
      if (!isPopover) {
        return h(
          'div',
          {
            class: {
              [`${CLASS_PREFIX}-feedback`]: true,
              ['el-form-item is-error']: props.isError,
            },
          },
          [
            h('div', { staticClass: props.isError ? 'el-form-item__content' : '' }, [
              slots.default?.(),
              h('div', { staticClass: props.isError ? 'el-form-item__error' : '' }, [
                props.feedback as string,
              ]),
            ]),
          ]
        )
      } else {
        // TODO: popover feedback
        return
      }
    }
  },
})
