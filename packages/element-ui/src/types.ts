import { Column, RowRaws, Worktable } from '@worktable/core'
import { Component } from 'vue'

export interface TableLayout {
  size: string
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

export type InnerComponent = 'input' | 'select' | 'datepicker' | 'checkbox' | 'group' | 'text'

export type Options = Array<{ label: string; value: any }>

export type Context = {
  worktable: Worktable
  layout: TableLayout
}
