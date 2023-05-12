import { defineComponent, computed, h } from 'vue-demi'
import dayjs from 'dayjs'
import { DatePicker } from 'element-ui'
import type { FocusAble, VueComponent } from '@element-ui/types'
import { observer } from 'mobx-vue'

const DATEPICKER = 'datepicker'
export const InnerDatePicker: VueComponent = observer(
  defineComponent({
    name: 'InnerDatePicker',
    props: { value: null },
    setup(props, { attrs, listeners }) {
      const val = computed(() => {
        const date = dayjs(props.value as any)
        // 格式化时间，防止 ElDatePicker 无法渲染
        return date.isValid() ? date.format('YYYY-MM-DD') : ''
      })
      return () =>
        h(DatePicker, {
          ref: DATEPICKER,
          staticStyle: { width: '100%' },
          props: Object.assign({}, props, {
            valueFormat: 'yyyy-MM-dd',
            value: val.value,
          }),
          attrs,
          on: listeners as any,
        })
    },
    methods: {
      focus() {
        const instance = this.$refs[DATEPICKER] as FocusAble
        if (instance && instance.focus) {
          instance.focus()
        }
      },
    },
  }) as any
)
