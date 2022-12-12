import { Column, RowRaws } from './schema'

export interface WorktableConstructorOpt {
  columns: Column[]
  initialData?: RowRaws
}
