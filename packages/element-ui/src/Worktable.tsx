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
import { getWorktableInjectKey, innerDefaultKey, ROWID, useFlashingValue } from '@/shared'
import { TABLE_EVENT_NAME } from '@worktable/core'
import { TableCell } from '@/components/TableCell'
import { splitPosKey } from '@/shared/pos-key'
import { observer } from 'mobx-vue'
import { Context } from './types'

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

    // HACK: re-render summary-line when every field changes of value
    // FIXME: layout shift of summary-line
    const [isTwinking, flash] = useFlashingValue()
    const summaryMethod = computed(() => {
      return isTwinking.value ? () => [''] : props.summaryMethod // the space is crucial
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
      const _columns = worktable.columns
        .filter((col) => !col.hidden)
        .map((col) => {
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
          ref: 'tableRef',
          attrs: Object.assign({}, attrs, {
            data: ctx.rowDatas.get(),
            'row-key': ROWID,
            showSummary: props.showSummary,
            summaryMethod: summaryMethod.value,
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

export default observer(InnerWorktable as any)
