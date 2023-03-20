import { Context, RowData, UIColumn, useWorkTableOpt } from '@/types'
import { computed as mcomputed } from 'mobx'
import { Column, makeRowProxy, Row, RowProxy, Worktable } from '@edsheet/core'
import { provide, shallowRef } from 'vue-demi'
import { bindWorktable, getWorktableInjectKey, mergePosKey, ROWID, walk } from '@/shared'
import { InnerRender } from '@/components/InnerComponent'

export function useWorktable(opt: useWorkTableOpt) {
  const _opt = { ...opt }
  const columns = [...opt.columns]
  const selectionCtx: Context['selectionCtx'] = { selections: [] }
  if ((columns[0].type as any) === 'selection') {
    selectionCtx.selectable = true
    selectionCtx.selectedAbleColDef = columns.shift()
  }
  _opt.columns = formatColumns(columns)
  const worktable = new Worktable(_opt)
  const injectKey = getWorktableInjectKey(opt.key)
  const rowDatas = mcomputed(() => generatePosData(worktable.rows, worktable.columns))
  const tableRef = shallowRef(null as any)
  const toggleRowExpansion = (filter: (row: RowProxy) => boolean, expanded: boolean) => {
    const targets: RowData[] = []
    const datas = rowDatas.get()
    walk(datas, (item) => {
      if (item._row && filter(makeRowProxy(item._row, true))) {
        targets.push(item)
      }
    })

    targets.forEach((row) => tableRef.value?.toggleRowExpansion(row, expanded))
  }

  const ctx: Context = {
    worktable,
    layout: Object.assign({ pagination: false, size: 'mini', feedback: 'terse' }, opt.layout),
    rowDatas,
    tableRef,
    toggleRowExpansion,
    opt: _opt,
    selectionCtx,
  }
  provide(injectKey, ctx)

  function removeSelectedRows() {
    selectionCtx.selections.forEach((row) => {
      worktable.remove(row.rid)
    })
    selectionCtx.selections = []
  }

  return {
    ...worktable, // TOOD: remove this
    toggleRowExpansion,
    removeSelectedRows,
    ...bindWorktable(worktable),
  }
}

function formatColumns(columns: UIColumn[]) {
  return columns.map((col) => {
    const formated = { ...col }
    if (col.render) {
      formated.component = InnerRender
      formated.componentProps = {
        render: col.render,
      }
    }
    return formated
  })
}

function generatePosData(rows: Row[], columns: Column[]) {
  return rows.map((row) => {
    const rowData: RowData = {}
    for (const field in row.data) {
      const { rid } = row.data[field].position
      rowData[field] = mergePosKey(rid, field)
    }
    rowData[ROWID] = `${row.rid}`
    rowData['_row'] = row
    // 树形数据
    if (row.children) {
      rowData['children'] = generatePosData(row.children, columns)
    }
    return rowData
  })
}
