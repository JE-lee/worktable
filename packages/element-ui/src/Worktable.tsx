import { defineComponent, inject, h, provide } from 'vue-demi'
import { Table as ElTable, TableColumn as ElTableColumn } from 'element-ui'
import { VNodeData } from 'vue'
import { getWorktableInjectKey, innerDefaultKey } from '@/shared'
import { Row } from '@worktable/core'
import { TableCell } from '@/components/TableCell'
import { mergePosKey, splitPosKey } from '@/shared/pos-key'
import { computed as mobxComputed } from 'mobx'
import { observer } from 'mobx-vue'
import { Context } from './types'

const ROWID = '_rowid'

const InnerWorktable = defineComponent({
  name: 'Worktable',
  props: {
    name: String, // injected key
  },
  setup(props, { attrs, listeners }) {
    const key = getWorktableInjectKey(props.name)
    const ctx = inject(key) as Context
    const worktable = ctx.worktable
    provide(innerDefaultKey, ctx)

    const positions = mobxComputed(() => generatePosData(worktable.rows))

    // render columns
    function renderColumns() {
      const _columns = worktable.columns.map((col) => {
        const scopedSlots: VNodeData['scopedSlots'] = {}

        // 在 table-row 渲染函数上执行, 当 cell 的 value 改变时，整行重新渲染
        scopedSlots.default = (scope) => {
          const row = scope.row as Record<string, string>
          const [rid, field] = splitPosKey(row[col.field])
          const pos = { rid, field }
          const cell = worktable.getCell(pos)
          if (!cell && process.env.NODE_ENV === 'development') {
            console.warn(`not a validable cell in postion ${pos}`)
          }

          return h(TableCell, {
            attrs: { cell, colDef: col },
          })
        }
        return h(ElTableColumn, {
          props: {
            prop: col.field,
            label: col.title,
            width: col.width,
          },
          scopedSlots,
        })
      })
      // 可多选
      // if (context.selectable) {
      //   _columns.unshift(
      //     h(ElTableColumn, {
      //       props: {
      //         type: 'selection',
      //         width: 55,
      //       },
      //     })
      //   )
      // }

      return _columns
    }

    // render pagination
    // function renderPagination() {
    //   return h(Pagination, {
    //     attrs: Object.assign({}, paginationAttrs, { total: total.value }),
    //     on: paginationListeners,
    //   })
    // }

    // const onSelectionChange = listeners['selection-change']
    // function onTableSelectionChange(rows: any[]) {
    //   selectRows(rows.map((row) => row[ROWID]))
    //   isFunction(onSelectionChange) && onSelectionChange(rows)
    // }

    function renderTable() {
      return h(
        ElTable,
        {
          attrs: Object.assign({}, attrs, {
            data: positions.get(),
            'row-key': ROWID,
          }),
          // on: Object.assign({}, listeners, {
          //   'selection-change': onTableSelectionChange,
          // }) as any,
          on: listeners as any,
        },
        [renderColumns()]
      )
    }
    return () => {
      return h('div', [renderTable()])
    }
  },
})

function generatePosData(rows: Row[]) {
  return rows.map((row) => {
    const rowPos: Record<string, string> & {
      children?: Array<Record<string, string>>
    } = {}

    for (const field in row.data) {
      const { rid } = row.data[field].position
      rowPos[field] = mergePosKey(rid, field)
    }
    rowPos[ROWID] = `${row.rid}`
    // 树形数据
    if (row.children) {
      rowPos['children'] = generatePosData(row.children)
    }
    return rowPos
  })
}

export default observer(InnerWorktable as any)
