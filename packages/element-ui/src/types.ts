import { Cell, Column, Row, Worktable } from '@edsheet/core'
import type { RowProxy, RowRaw, RowRaws } from '@edsheet/core'
import { Component, ShallowRef } from 'vue-demi'
import { IComputedValue } from 'mobx'
import { bindWorktable } from './shared'
import type { usePagination } from '@element-ui/components/InnerPagination'
import { CompositionCache } from './shared/composition-cache'

export type Feedbacklayout = 'terse' | 'popover'
export interface TableLayout {
  pagination?: boolean
  size?: string
  feedback?: Feedbacklayout
}
export type useWorkTableOpt = {
  key?: string
  columns: Array<UIColumn>
  initialData?: RowRaws
  layout?: TableLayout
}

export type VueComponent = Component

export type FocusAble = Vue & {
  focus?: () => void
}
export type BaseComponent = {
  component: string | VueComponent
  componentProps?: Record<string, any>
  on?: Record<string, () => void>
}

export type InnerComponent =
  | 'input'
  | 'select'
  | 'datepicker'
  | 'checkbox'
  | 'render'
  | 'text'
  | 'async-select'
  | 'cascader'

export type Options = Array<{ label: string; value: any }>

export type BaseContext = {
  worktable: Worktable
  layout: TableLayout
  rowDatas: IComputedValue<RowData[]>
  tableRef: ShallowRef<any>
  opt: useWorkTableOpt
  selectionCtx: {
    selections: RowProxy[]
  }
  componentCache: CompositionCache<VueComponent>
}

export type Context = BaseContext & {
  toggleRowExpansion: (filter: (row: RowProxy) => boolean, expanded: boolean) => void
  paginationCtx: ReturnType<typeof usePagination>
}

export type RenderRowProxy = RowProxy & {
  toggleExpansion: (expanded: boolean) => void
}

export type DynamicRender = (row: RenderRowProxy) => void

export type UIColumn = Column & {
  fixed?: string // left or right
  render?: DynamicRender
  renderHeader?: (ctx: {
    field: string
    colIndex?: number
    add: Worktable['addRow']
    worktable: ReturnType<typeof bindWorktable>
  }) => void
}

export type RowData = Record<string, string> & {
  children?: Array<Record<string, string>>
  _row?: Row
}

export type Listener = (...args: any[]) => void | Array<(...args: any[]) => void>

export type CellContext = {
  cell: Cell
  colDef: Column
}
