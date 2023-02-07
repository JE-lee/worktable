import { observable, computed, makeObservable, runInAction } from 'mobx'
import { isFunction, debounce } from 'lodash-es'

export function usePagination(reaction?: (pagination: { size: number; current: number }) => void) {
  const attr = observable({
    pageSize: 10,
    pageSizes: [10, 20, 50, 100],
    layout: 'total, sizes, prev, pager, next',
    currentPage: 1,
  })

  const pagination = computed(() => {
    return {
      current: attr.currentPage,
      size: attr.pageSize,
    }
  })
  const loading = makeObservable({ value: false }, { value: observable.ref })

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
    runInAction(() => {
      attr.pageSize = val
      query()
    })
  }

  const onCurrentChange = (val: number) => {
    runInAction(() => {
      attr.currentPage = val
      query()
    })
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
