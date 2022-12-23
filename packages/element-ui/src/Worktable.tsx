import { defineComponent, inject, computed, h } from 'vue-demi'
import { Table as ElTable, TableColumn as ElTableColumn } from 'element-ui'
import { VNodeData } from 'vue'
import { getWorktableInjectKey } from './shared'
import { Worktable, Row } from '@worktable/core'
import { TableCell } from './component'
import isFunction from 'lodash/isFunction'

const ROWID = '_rowid'
const sperator = '$'
const mergePosKey = (index: number, field: string) => `${index}${sperator}${field}`
const splitPosKey = (key: string) => {
  const [index, field] = key.split(sperator)
  return [+index, field] as [number, string]
}

export default defineComponent({
  name: 'EditTable',
  props: {
    name: String, // injected key
  },
  setup(props, { attrs, listeners }) {
    const context = inject(getWorktableInjectKey(props.name)) as Worktable
    // dynamic columns
    // const columns = computed(() =>
    //   context.columns.filter((colDef) => !colDef.hidden /* && !colDef.virtual */)
    // )
    // const {
    //   rows,
    //   pagination: { paginationAttrs, paginationListeners, total },
    //   selectRows,
    //   getCell,
    // } = context
    const { getColumns } = context
    const columns = getColumns()

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

    // const positions = computed(() => generatePosData(rows.value))
    const positions = generatePosData()

    // render columns
    function renderColumns() {
      const _columns = columns.value.map((col) => {
        const scopedSlots: VNodeData['scopedSlots'] = {}

        // 在 table-row 渲染函数上执行
        scopedSlots.default = (scope) => {
          const row = scope.row as Record<string, string>
          const [rid, field] = splitPosKey(row[col.field])
          const pos = { rid, field }
          const cell = getCell(pos)

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
          attrs,
          props: {
            data: positions.value,
            'row-key': ROWID,
          },
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
