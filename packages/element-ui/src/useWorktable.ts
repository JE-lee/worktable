import { Context, RowData, UIColumn, useWorkTableOpt } from '@/types'
import { computed as mobxComputed } from 'mobx'
import { makeRowProxy, Row, RowRaw, Worktable } from '@worktable/core'
import { provide, shallowRef } from 'vue-demi'
import { getWorktableInjectKey, mergePosKey, ROWID, walk } from '@/shared'
import { InnerRender } from '@/components/InnerComponent'

export function useWorktable(opt: useWorkTableOpt) {
  const _opt = { ...opt }
  _opt.columns = formatColumns(_opt.columns)
  const worktable = new Worktable(_opt)
  const injectKey = getWorktableInjectKey(opt.key)
  const rowDatas = mobxComputed(() => generatePosData(worktable.rows))
  const tableRef = shallowRef(null as any)
  const toggleRowExpansion = (filter: (row: RowRaw) => boolean, expanded: boolean) => {
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
    layout: opt.layout || {},
    rowDatas,
    tableRef,
    toggleRowExpansion,
  }
  provide(injectKey, ctx)

  return {
    validate: worktable.validate.bind(worktable),
    remove: worktable.remove.bind(worktable),
    add: worktable.add.bind(worktable),
    getData: worktable.getData.bind(worktable),
    toggleRowExpansion,
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

function generatePosData(rows: Row[]) {
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
      rowData['children'] = generatePosData(row.children)
    }
    return rowData
  })
}
