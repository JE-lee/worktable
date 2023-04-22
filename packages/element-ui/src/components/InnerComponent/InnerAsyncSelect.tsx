import { defineComponent, h, shallowRef, onBeforeMount, Ref, ref, watchEffect } from 'vue-demi'
import { InnerSelect } from './InnerSelect'
import { isFunction } from 'lodash-es'
import type { FocusAble } from '@/types'
import { usePersistentContext } from '@/shared'

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
    fresh: Boolean,
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
    const state = usePersistentContext({
      fetched: false,
      searched: false,
      times: 0,
      anchor: 0,
      loading: false,
      options: [] as any[],
    })

    watchEffect(() => {
      state.options = props.options || []
    })

    const on: Record<string, any> = { ...listeners }

    const fetch = (search = '') => {
      if (isFunction(props.remoteMethod)) {
        const mark = ++state.times
        state.anchor = mark
        state.loading = true
        props
          .remoteMethod(search)
          .then((optionList: any[]) => {
            // timing control
            if (state.anchor === mark) {
              state.options = optionList
              // persist
              state.fetched = true
              state.searched = state.searched || props.search // set searched true in search mode
            }
          })
          .finally(() => {
            state.loading = false
          })
      }
    }

    const remoteMethod = fetch

    if (props.lazy) {
      const onFocus = on['focus']
      on.focus = (...args: any[]) => {
        if (!props.search || (props.search && props.searchImmediate)) {
          if ((props.fresh || !state.fetched) && !state.loading) {
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
          options: state.options,
          loading: state.loading,
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
