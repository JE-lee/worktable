import { Row } from '../Row'
import { EventEmitter } from './../EventEmitter'
import { CellValue, Column, RowRaw, RowRaws } from './schema'

export interface WorktableConstructorOpt {
  columns: Column[]
  initialData?: RowRaws
}

export type CellState = 'value' | 'previewing' | 'validating' | 'errors'

export type Filter = (row: RowRaw) => boolean

export type CellFactoryContext = {
  parent: Row
  colDef: Column
  evProxy?: EventEmitter
  value?: CellValue
}
