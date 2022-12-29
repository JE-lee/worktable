import { Column, RowRaw, RowRaws } from './schema'

export interface WorktableConstructorOpt {
  columns: Column[]
  initialData?: RowRaws
}

export type CellState = 'value' | 'previewing' | 'validating' | 'errors'

export type Filter = (row: RowRaw) => boolean
