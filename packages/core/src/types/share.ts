import { Row } from '../Row'
import { EventEmitter } from './../EventEmitter'
import { CellValue, Column, RowProxy, RowRaws } from './schema'

export interface WorktableConstructorOpt {
  columns: Column[]
  initialData?: RowRaws
}

export type CellState = 'value' | 'previewing' | 'validating' | 'errors'

export type Filter = (row: RowProxy) => boolean

export type CellFactoryContext = {
  parent: Row
  colDef: Column
  evProxy?: EventEmitter
  value?: CellValue
}

export type StaticComponentProps = Record<string, any>

export type FieldDeconstructMeta = {
  type: 'array' | 'object'
  keyMaps: Array<[string, string]>
}
