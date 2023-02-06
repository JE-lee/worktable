import { defineComponent, h, computed } from 'vue-demi'
import { observer } from 'mobx-vue'
import { Pagination, Select, Option } from 'element-ui'

function makePages(max: number) {
  const pages: number[] = []
  max = Math.max(0, max)
  while (max > 0) {
    pages.unshift(max--)
  }
  return pages
}
export const InnerPagination = observer(
  defineComponent({
    name: 'InnerPagination',
    props: {
      errors: {
        type: Object, // Record<string, boolean>
        required: true,
      },
      total: Number,
      currentPage: Number,
      pageSize: Number,
    },
    setup(props, { attrs, listeners: on }) {
      // FIXME: computed type declaration
      const pages = computed<number[]>(() =>
        makePages(Math.ceil((props.total || 0) / (props.pageSize || 0)))
      )
      return () => {
        const hasError = Object.keys(props.errors).some((k) => props.errors[k])
        console.log('errors render', hasError)
        const jumper = h(
          Select,
          {
            style: {
              width: '80px',
              borderColor: hasError ? 'red' : 'inhreit',
            },
            props: {
              value: props.currentPage,
              size: 'mini',
            },
            on: {
              input: on['current-change'],
            },
          },
          pages.value.map((pageNum, index) =>
            h(
              Option,
              {
                props: {
                  key: index,
                  label: pageNum,
                  value: pageNum,
                },
              },
              [
                h(
                  'span',
                  {
                    style: {
                      color: `${props.errors[pageNum] ? 'red' : 'black'}`,
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
            style: {
              display: 'flex',
              'justify-content': 'flex-end',
            },
          },
          [
            h(Pagination, {
              attrs: Object.assign({}, attrs, props),
              on,
            }),
            h('span', { staticClass: hasError ? 'el-form-item is-error' : '' }, [jumper]),
          ]
        )
      }
    },
  }) as any // FIXME: correct type declaration
)
