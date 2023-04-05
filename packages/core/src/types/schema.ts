import { RuleItem } from 'async-validator'
import type { Row } from '../Row'
import { RowErrors, StaticComponentProps } from './share'

export type Options = Array<{ label: string; value: any }>

export type ValueType = 'boolean' | 'string' | 'number' | 'object' | 'array'

type BaseCellValue = string | number | boolean

type BaseObjectCellValue = Record<string, BaseCellValue>

export type CellValue =
  | BaseCellValue
  | BaseObjectCellValue
  | Array<BaseCellValue | BaseObjectCellValue>

export interface CellPosition {
  rid: number // row id
  field: string // colomn field
}

// TODO: recursive type
export type RowRaw = {
  [field: string]: CellValue | RowRaw[]
} & { children?: RowRaw[] }

export type RowAction = Pick<
  Row,
  'reset' | 'addRow' | 'addRows' | 'removeSelf' | 'setComponentProps' | 'setValues'
> & {
  removeRow: Row['remove']
  removeAllRow: Row['removeAll']
  getValue: Row['getRaw']
}

export type RowProxy = {
  parent?: RowProxy
  children: RowProxy[]
  index: number
  rid: number
  data: RowRaw
  errors: RowErrors
} & RowAction

export type RowRaws = Array<RowRaw>

export type EventContext = any[]

type ColumnComponent = any

type ColumnComponentProps = StaticComponentProps | ((row: RowProxy) => StaticComponentProps)

type ColumnConponentListeners = Record<string, (...args: any[]) => void>

export type Rule = Omit<RuleItem, 'transform' | 'asyncValidator' | 'validator'> & {
  validator?: (value: CellValue, row: RowProxy) => Promise<any> | any
}

export type EffectListener = (...args: EventContext) => void

export interface Column {
  title?: string
  field: string
  type?: ValueType
  required?: boolean
  requiredMessage?: string
  disabled?: boolean | ((row: RowProxy) => boolean)
  component?: ColumnComponent
  preview?: ColumnComponent
  componentProps?: ColumnComponentProps
  componentListeners?: ColumnConponentListeners
  default?: CellValue | (() => CellValue)
  value?: (row: RowProxy) => CellValue // dynamic value
  enum?: Options
  rule?: Rule
  hidden?: boolean
  virtual?: boolean
  effects?: {
    [eventName: string]: EffectListener
  }
  width?: number
}
