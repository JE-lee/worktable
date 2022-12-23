import { Column, RowRaws } from '@worktable/core'

export type useWorkTableOpt = {
  key?: string
  columns: Array<Column>
  initialData?: RowRaws
  selectable?: boolean
}
