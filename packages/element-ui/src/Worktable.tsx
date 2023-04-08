import {
  defineComponent,
  inject,
  h,
  provide,
  computed,
  watchEffect,
  VNodeData,
  onMounted,
  getCurrentInstance,
} from 'vue-demi'
import { Table as ElTable, TableColumn as ElTableColumn } from 'element-ui'
import {
  bindWorktable,
  CLASS_PREFIX,
  getWorktableInjectKey,
  innerDefaultKey,
  ROWID,
  useFlashingValue,
} from '@/shared'
import { makeRowProxy, TABLE_EVENT_NAME } from '@edsheet/core'
import { TableCell } from '@/components/TableCell'
import { splitPosKey } from '@/shared/pos-key'
import { computed as mcomputed } from 'mobx'
import { observer } from 'mobx-vue'
import { Context, RowData, UIColumn } from './types'
import { usePagination, InnerPagination } from '@/components/InnerPagination'
import { isFunction } from 'lodash-es'

const InnerWorktable = defineComponent({
  name: 'Worktable',
  props: {
    name: String, // injected key
    summaryMethod: null,
    showSummary: Boolean,
  },
  setup(props, { attrs, listeners }) {
    const key = getWorktableInjectKey(props.name)
    const ctx = inject(key) as Context
    const worktable = ctx.worktable
    const vm = getCurrentInstance()
    provide(innerDefaultKey, ctx)

    const datas = ctx.rowDatas
    const { attr: paginationAttrs, on: paginationListeners, pagination } = usePagination()
    const visibleDatas = mcomputed(() => {
      if (ctx.layout.pagination) {
        const { current, size } = pagination.get()
        return datas.get().slice((current - 1) * size, current * size)
      } else {
        return datas.get()
      }
    })

    // FIXME: avoid re-rendering the entire table when field values change
    const [isTwinking, flash] = useFlashingValue()
    let cacheSummaries: string[] = []
    const summaryMethod = computed<(...args: any[]) => any>(() => {
      const _summaryMethod = (ctx: { columns: any[] }) => {
        if (isFunction(props.summaryMethod)) {
          const data = worktable.getData()
          cacheSummaries = props.summaryMethod({ columns: ctx.columns, data })
        }
        return cacheSummaries
      }
      return isTwinking.value ? () => cacheSummaries : _summaryMethod
    })
    watchEffect(() => {
      if (props.showSummary) {
        worktable.addEffect(TABLE_EVENT_NAME.ON_FIELD_VALUE_CHANGE, flash)
      } else {
        worktable.removeEffect(TABLE_EVENT_NAME.ON_FIELD_VALUE_CHANGE)
      }
    })

    onMounted(() => {
      ctx.tableRef.value = vm?.proxy.$refs['tableRef']
    })

    // render columns
    function renderColumns() {
      const _columns = (worktable.columns as UIColumn[])
        .filter((col) => !col.hidden)
        .map((col, colIndex) => {
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
              attrs: { cell, colDef: col, colIndex },
            })
          }
          // column header
          scopedSlots.header = ({ column }) => {
            const field = column.property
            if (col.renderHeader) {
              return col.renderHeader({
                field,
                colIndex: colIndex,
                rows: worktable.getData(),
                add: worktable.addRow.bind(worktable),
                worktable: bindWorktable(worktable),
              }) as any
            } else {
              const required = col.required
              return h('span', { class: { required } }, col.title)
            }
          }
          return h(ElTableColumn, {
            props: {
              prop: col.field,
              width: col.width,
              fixed: col.fixed,
            },
            scopedSlots,
          })
        })
      // 可多选
      if (ctx.selectionCtx.selectable) {
        _columns.unshift(
          h(ElTableColumn, {
            props: ctx.selectionCtx.selectedAbleColDef,
          })
        )
      }

      return _columns
    }

    // render pagination
    function renderPagination() {
      return h(InnerPagination, {
        style: { marginTop: '10px' },
        attrs: Object.assign({}, paginationAttrs),
        on: paginationListeners,
      })
    }

    const onSelectionChange = listeners['selection-change']
    function onTableSelectionChange(rows: RowData[]) {
      const rowProxys = rows.map((row) => row._row).map((row) => makeRowProxy(row!, true))
      ctx.selectionCtx.selections = rowProxys
      isFunction(onSelectionChange) && onSelectionChange([...rowProxys])
    }

    function renderTable() {
      return h(
        ElTable,
        {
          staticClass: CLASS_PREFIX,
          ref: 'tableRef',
          attrs: Object.assign({}, attrs, {
            data: visibleDatas.get(),
            'row-key': ROWID,
            showSummary: props.showSummary,
            summaryMethod: summaryMethod.value,
          }),
          on: Object.assign({}, listeners, {
            'selection-change': onTableSelectionChange,
          }),
        },
        [renderColumns()]
      )
    }
    return () => {
      return h('div', [renderTable(), ctx.layout.pagination && renderPagination()])
    }
  },
})

export default observer(InnerWorktable as any)
