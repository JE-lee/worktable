import {
  defineComponent,
  h,
  inject,
  provide,
  onMounted,
  getCurrentInstance,
  shallowRef,
  onUnmounted,
  computed,
  watch,
} from 'vue-demi'
import { AgGridVue } from 'ag-grid-vue'
import type { GridReadyEvent, GridApi, IRowNode } from 'ag-grid-community'
import type { VueComponent, BaseContext, UIColumn } from './types'
import { CLASS_PREFIX, getWorktableInjectKey, innerDefaultKey, ROWID } from '@element-ui/shared'
import { AgWrapper } from './components/AgWrapper'
import { AgHeader } from './components/AgHeader'
import { CellPosition, RowProxy, TABLE_EVENT_NAME } from '@edsheet/core'

const InnerAgGridTable = defineComponent({
  components: {
    AgWrapper,
    AgHeader,
  },
  props: {
    name: String, // injected key
    // 表格的行数小于 minimumRows 的时候，不激活虚拟滚动
    minimumRows: {
      type: Number,
      default: 100,
    },
  },
  setup(props, { attrs }) {
    const vm = getCurrentInstance()
    const gridApi = shallowRef<GridApi<any> | null>(null)
    const key = getWorktableInjectKey(props.name)
    const ctx = inject(key) as BaseContext
    const worktable = ctx.worktable
    const columnDefs = computed(() => {
      const colDefs = covert2ColumnDefs(worktable.columns.filter((col) => !col.hidden))
      // add extra render params
      colDefs.forEach((colDef) => {
        colDef.cellRendererParams = colDef.cellRendererParams || {}
        colDef.cellRendererParams.worktable = worktable
        colDef.headerComponentParams = colDef.headerComponentParams || {}
        colDef.headerComponentParams.worktable = worktable
      })
      return colDefs
    })
    const rowData = useVueData(() => ctx.rowDatas.value)
    // https://www.ag-grid.com/vue-data-grid/grid-options/#reference-rowModels-getRowId
    // 提升单行新增的性能
    const getRowId = (params: any) => params.data[ROWID]
    provide(innerDefaultKey, ctx)

    // 校验结束的时候，将第一个错误的单元格移动到视窗中
    worktable.addEffect(TABLE_EVENT_NAME.ON_VALIDATE_FINISH, () => {
      const rows: RowProxy[] = worktable.findAll()
      let firstErrorCell: CellPosition | null = null
      for (const row of rows) {
        for (const field in row.errors) {
          if (row.errors[field].length > 0) {
            firstErrorCell = { rid: row.rid, field }
            break
          }
        }
        if (firstErrorCell) break
      }

      if (firstErrorCell) {
        scrollTo(firstErrorCell)
      }
    })

    onMounted(() => {
      ctx.tableRef.value = vm?.proxy.$refs['tableRef']
    })

    function onGridReady(params: GridReadyEvent<any>) {
      gridApi.value = params.api
    }

    function scrollTo(position: CellPosition) {
      // 移动到目标行
      gridApi.value?.ensureNodeVisible((row: IRowNode<any>) => {
        return String(row.id) === String(position.rid)
      }, 'middle')
      // 移动到目标列
      gridApi.value?.ensureColumnVisible(position.field, 'middle')
    }

    return () => {
      return h(AgGridVue as VueComponent, {
        ref: 'tableRef',
        class: `${CLASS_PREFIX} ag-grid-worktable ag-theme-alpine`,
        staticClass: CLASS_PREFIX,
        attrs: {
          ...attrs,
          columnDefs: columnDefs.value,
          rowData: rowData.value,
          getRowId,
          debounceVerticalScrollbar: true,
          rowBuffer:
            rowData.value.length <= props.minimumRows
              ? props.minimumRows
              : (attrs.rowBuffer as number) || 10,
          // https://www.ag-grid.com/angular-data-grid/dom-virtualisation/#suppress-virtualisation
          suppressColumnVirtualisation: true,
        },
        on: {
          gridReady: onGridReady,
        },
      })
    }
  },
})

export default InnerAgGridTable as VueComponent

function covert2ColumnDefs(columns: UIColumn[]): Record<string, any>[] {
  const colDefs = columns.map((col) => {
    return {
      ...col,
      field: col.field,
      headerName: col.title,
      cellRenderer: 'AgWrapper',
      // https://www.ag-grid.com/vue-data-grid/row-height/
      // autoHeight: true,
      width: col.width,
      pinned: col.fixed,
      headerComponent: 'AgHeader',
      headerComponentParams: {
        renderHeader: col.renderHeader,
      },
      // https://www.ag-grid.com/vue-data-grid/column-properties/#reference-header-autoHeaderHeight
      autoHeaderHeight: true,
    }
  })
  return colDefs
}

function useVueData<T>(tracker: () => T) {
  const data = shallowRef<T>(tracker())
  const stop = watch(tracker, (value: T) => (data.value = value))

  onUnmounted(() => stop())

  return data
}
