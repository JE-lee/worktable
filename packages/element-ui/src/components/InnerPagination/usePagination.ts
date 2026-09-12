import { reactive, computed, ref } from 'vue-demi'
import { isFunction, debounce } from 'lodash-es'

export const PAGE_SIZE = 10
export function usePagination(reaction?: (pagination: { size: number; current: number }) => any) {
  const attr = reactive({
    pageSize: PAGE_SIZE,
    pageSizes: [PAGE_SIZE, 20, 50, 100].sort(),
    layout: 'total, sizes, prev, pager, next',
    currentPage: 1,
  })

  const pagination = computed(() => {
    return {
      current: attr.currentPage,
      size: attr.pageSize,
    }
  })
  const loading = ref(false)

  attr.pageSize = attr.pageSizes[0]

  const _query = () => {
    if (isFunction(reaction)) {
      loading.value = true
      const wait = reaction({ size: attr.pageSize, current: attr.currentPage })
      if (wait instanceof Promise) {
        wait.finally(() => (loading.value = false))
      } else {
        loading.value = false
      }
    }
  }
  const query = debounce(_query, 20) // 20 is crucial

  const onSizeChange = (val: number) => {
    attr.pageSize = val
    query()
  }

  const onCurrentChange = (val: number) => {
    attr.currentPage = val
    query()
  }

  const refresh = (current?: number) => {
    if (current) {
      attr.currentPage = current
    }
    query()
  }

  query()

  return {
    loading,
    attr,
    on: {
      'size-change': onSizeChange,
      'current-change': onCurrentChange,
    },
    refresh,
    pagination,
  }
}
