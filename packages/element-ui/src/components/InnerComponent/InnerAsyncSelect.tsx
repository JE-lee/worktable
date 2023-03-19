import { defineComponent, h, shallowRef, onBeforeMount, Ref, ref, watchEffect } from 'vue-demi'
import { InnerSelect } from './InnerSelect'
import { isFunction } from 'lodash-es'
import { FocusAble } from '@/types'

const SELECT_REF = 'select-ref'
export const InnerAsyncSelect = defineComponent({
  name: 'InnerAsyncSelect',
  props: {
    remoteMethod: {
      type: Function,
      default: () => Promise.resolve([]),
    },
    lazy: {
      type: Boolean,
      default: true,
    },
    search: Boolean,
    searchImmediate: {
      type: Boolean,
      default: true,
    },
    options: {
      type: Array,
      default: () => [],
    },
  },
  setup(props, { attrs, listeners }) {
    const options: Ref<any[]> = shallowRef([])

    let fetched = false
    let searched = false
    let times = 0
    let anchor = 0

    const loading = ref(false)
    const on: Record<string, any> = { ...listeners }

    watchEffect(() => (options.value = props.options || []))

    const fetch = (search = '') => {
      if (isFunction(props.remoteMethod)) {
        const mark = ++times
        anchor = mark
        loading.value = true
        props
          .remoteMethod(search)
          .then((optionList: any[]) => {
            // timing control
            if (anchor === mark) {
              options.value = optionList
              fetched = true
              searched = searched || props.search // set searched true in search mode
            }
          })
          .finally(() => {
            if (anchor === mark) {
              loading.value = false
            }
          })
      }
    }

    const remoteMethod = fetch

    if (props.lazy) {
      const onFocus = on['focus']
      on.focus = (...args: any[]) => {
        if (!props.search || (props.search && props.searchImmediate)) {
          if (!fetched && !loading.value) {
            fetch()
          }
        }
        isFunction(onFocus) && onFocus(...args)
      }
    } else {
      onBeforeMount(fetch)
    }

    return () => {
      return h(InnerSelect, {
        ref: SELECT_REF,
        attrs: Object.assign({}, attrs, props, {
          options: options.value,
          loading: loading.value,
          remoteMethod,
          remote: !!props.search,
          filterable: !!props.search,
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
