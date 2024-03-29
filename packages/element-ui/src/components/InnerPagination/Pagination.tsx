import { defineComponent, h, inject } from 'vue-demi'
import { observer } from 'mobx-vue'
import { computed as mcomputed } from 'mobx'
import { Pagination, Select, Option } from 'element-ui'
import { CLASS_PREFIX, flatten, innerDefaultKey } from '@element-ui/shared'
import type { Context, VueComponent } from '@element-ui/types'

function makePages(max: number) {
  const pages: number[] = []
  max = Math.max(0, max)
  while (max > 0) {
    pages.unshift(max--)
  }
  return pages
}
export const InnerPagination: VueComponent = observer(
  defineComponent({
    name: 'InnerPagination',
    props: {
      currentPage: Number,
      pageSize: Number,
    },
    setup(props, { attrs, listeners: on }) {
      const { worktable, rowDatas } = inject(innerDefaultKey) as Context
      const total = mcomputed(() => rowDatas.get().length)
      const errors = mcomputed<Record<string, boolean>>(() => {
        if (!props.pageSize) return {}
        const rows = worktable.rows
        const errors: Record<string, boolean> = {}
        const size = props.pageSize
        const maxPages = Math.ceil(total.get() / size)
        for (let i = 0; i < maxPages; i++) {
          let isError = false
          flatten(rows.slice(i * size, (i + 1) * size)).some((row) => {
            for (const k in row.data) {
              if (row.data[k].errors.length > 0) {
                isError = true
                break
              }
            }
          })
          errors[i + 1] = isError
        }
        return errors
      })

      // FIXME: computed type declaration
      const pages = mcomputed<number[]>(() =>
        makePages(Math.ceil(total.get() / (props.pageSize || 0)))
      )
      return () => {
        const errorMap = errors.get()
        const hasError = Object.keys(errorMap).some((k) => errorMap[k])
        const jumper = h(
          Select,
          {
            class: {
              [`${CLASS_PREFIX}-pagination__jumper`]: true,
              'is-error': hasError,
            },
            props: {
              value: props.currentPage,
              size: 'mini',
            },
            on: {
              input: on['current-change'],
            },
          },
          pages.get().map((pageNum, index) =>
            h(
              Option,
              {
                key: index,
                props: {
                  label: pageNum,
                  value: pageNum,
                },
              },
              [
                h(
                  'span',
                  {
                    class: {
                      [`${CLASS_PREFIX}-pagination__selector__option`]: true,
                      'is-error': errorMap[pageNum],
                    },
                  },
                  [`${pageNum}`]
                ),
              ]
            )
          )
        )
        return h(
          'div',
          {
            staticClass: `${CLASS_PREFIX}-pagination`,
            style: {
              display: 'flex',
              'justify-content': 'flex-end',
            },
          },
          [
            h(Pagination, {
              attrs: Object.assign({}, attrs, props, { total: total.get() }),
              on,
            }),
            h('span', { staticClass: hasError ? 'el-form-item is-error' : '' }, [jumper]),
          ]
        )
      }
    },
  }) as any // FIXME: correct type declaration
)
