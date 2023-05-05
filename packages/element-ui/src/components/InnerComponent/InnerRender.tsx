import { defineComponent, inject, h } from 'vue-demi'
import { bindWorktable, innerDefaultKey } from '@/shared'
import { Cell, makeRowProxy } from '@edsheet/core'
import { Context } from '@/types'
import { observer } from 'mobx-vue'
import { isFunction, isString, isNumber, isBoolean } from 'lodash-es'

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

      return () => {
        try {
          const render = props.render
          if (isFunction(render)) {
            const vnode = render(renderRowProxy, bindWorktable(worktable))
            return h('div', isPrimitive(vnode) ? String(vnode) : [vnode])
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

function isPrimitive(val: any) {
  return isString(val) || isNumber(val) || isBoolean(val)
}
