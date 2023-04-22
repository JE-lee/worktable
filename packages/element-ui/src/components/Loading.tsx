import { defineComponent, h } from 'vue-demi'

export const Loading = defineComponent({
  name: 'Loading',
  props: {
    loading: Boolean,
  },
  setup(props, { slots }) {
    return () => {
      const loading = props.loading
      return h(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
          },
        },
        [
          h(
            'div',
            {
              style: 'flex: 1',
            },
            slots.default?.()
          ),
          loading &&
            h('i', {
              staticClass: 'el-icon-loading',
            }),
        ]
      )
    }
  },
})
