import { defineComponent, inject } from 'vue-demi'
import { innerDefaultKey } from '@/shared'
import { Cell, makeRowProxy } from '@edsheet/core'
import { Context } from '@/types'
import { observer } from 'mobx-vue'
import { isFunction } from 'lodash-es'

export const InnerRender = observer(
  defineComponent({
    name: 'InnerRender',
    props: {
      cell: {
        type: Object,
        required: true,
      },
      render: {
        type: Function,
      },
    },
    setup(props) {
      const { worktable, toggleRowExpansion } = inject(innerDefaultKey) as Context
      const cell = props.cell as Cell
      const row = worktable.getRowByRid(cell.position.rid)
      const rowProxy = makeRowProxy(row!)
      const toggleExpansion = (expanded: boolean) => {
        toggleRowExpansion((row) => row.rid === cell.position.rid, expanded)
      }

      const renderRowProxy = new Proxy(rowProxy, {
        get(target, prop) {
          if (prop === 'toggleExpansion') {
            return toggleExpansion
          } else {
            return Reflect.get(target, prop)
          }
        },
      })

      // FIXME: the runtime error of  render function was catched silently
      return () => {
        try {
          const render = props.render
          if (isFunction(render)) {
            return render(renderRowProxy)
          }
        } catch (err) {
          if (process.env.NODE_ENV === 'development') {
            console.error(err)
          }
        }
      }
    },
  }) as any
)
