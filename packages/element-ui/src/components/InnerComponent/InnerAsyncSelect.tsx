import { defineComponent, h, shallowRef, onBeforeMount, Ref, ref } from 'vue-demi'
import { InnerSelect } from './InnerSelect'
import { isFunction } from 'lodash-es'
import { FocusAble } from '@/types'
import { noop } from '@/shared'

const SELECT_REF = 'select-ref'
export const InnerAsyncSelect = defineComponent({
  name: 'InnerAsyncSelect',
  props: {
    remoteMethod: {
      type: Function,
      required: true,
    },
    lazy: Boolean,
    remote: Boolean,
  },
  setup(props, { attrs, listeners }) {
    const options: Ref<any[]> = shallowRef([])
    let fetched = false
    let remoteMethod: () => void = noop
    const loading = ref(false)
    const on = { ...listeners }

    const fetch = (search?: string) => {
      if (isFunction(props.remoteMethod)) {
        loading.value = true
        props
          .remoteMethod(search)
          .then((optionList: any[]) => {
            options.value = optionList
            fetched = true
          })
          .finally(() => {
            loading.value = false
          })
      }
    }

    // not search mode
    if (!props.remote) {
      if (!props.lazy) {
        onBeforeMount(fetch)
      } else {
        const onFocus = on['focus']
        on.focus = (...args: any[]) => {
          if (!fetched) {
            fetch()
          }
          isFunction(onFocus) && onFocus(...args)
        }
      }
    } else {
      remoteMethod = fetch
    }

    return () => {
      return h(InnerSelect, {
        ref: SELECT_REF,
        attrs: Object.assign({}, attrs, props, {
          options: options.value,
          loading: loading.value,
          remoteMethod,
        }),
        on,
      })
    }
  },
  methods: {
    focus() {
      return (this.$refs[SELECT_REF] as FocusAble).focus?.()
    },
  },
})
