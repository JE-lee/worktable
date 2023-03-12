import { Column, Row, Worktable } from '@edsheet/core'
import type { RowProxy, RowRaw, RowRaws } from '@edsheet/core'
import { Component, ShallowRef } from 'vue-demi'
import { IComputedValue } from 'mobx'

export type Feedbacklayout = 'terse' | 'popover'
export interface TableLayout {
  pagination?: boolean
  size?: string
  feedback?: Feedbacklayout
}
export type useWorkTableOpt = {
  key?: string
  columns: Array<Column>
  initialData?: RowRaws
  selectable?: boolean
  layout: TableLayout
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

export type Context = {
  worktable: Worktable
  layout: TableLayout
  rowDatas: IComputedValue<RowData[]>
  tableRef: ShallowRef<any>
  toggleRowExpansion: (filter: (row: RowProxy) => boolean, expanded: boolean) => void
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
    colIndex: number
    add: Worktable['add']
    rows: RowRaw[]
  }) => void
}

export type RowData = Record<string, string> & {
  children?: Array<Record<string, string>>
  _row?: Row
}

export type Listener = (...args: any[]) => void | Array<(...args: any[]) => void>
