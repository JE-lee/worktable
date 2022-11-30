import { Column, RowRaws } from './schema'

export interface WorktypeConstructorOpt {
  columns: Column[]
  initialData?: RowRaws
}
