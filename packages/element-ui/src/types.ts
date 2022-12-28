import { Column, RowRaws } from '@worktable/core'
import { Component } from 'vue'

export type useWorkTableOpt = {
  key?: string
  columns: Array<Column>
  initialData?: RowRaws
  selectable?: boolean
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

export type InnerComponent = 'input' | 'select' | 'datepicker' | 'checkbox' | 'group'

export type Options = Array<{ label: string; value: any }>
