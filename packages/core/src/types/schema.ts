import { RuleItem } from 'async-validator'

export type Options = Array<{ label: string; value: any }>

export type ValueType = 'boolean' | 'string' | 'number' | 'object' | 'array'

type BaseCellValue = string | number | boolean

export type CellValue = BaseCellValue | Record<string, BaseCellValue> | Array<BaseCellValue>

export interface CellPosition {
  rid: number // row id
  field: string // colomn field
}

// TODO: recursive type
export type RowRaw = {
  [field: string]: CellValue | RowRaw[]
} & { children?: RowRaw[] }

export type RowRaws = Array<RowRaw>

export type EventContext = any[]

type ColumnComponent = any

type ColumnComponentProps = Record<string, any> | ((row: RowRaw) => Record<string, any>)

type ColumnConponentListeners = Record<string, (...args: any[]) => void>

export type Rule = Omit<RuleItem, 'transform' | 'asyncValidator' | 'validator'> & {
  validator?: (value: CellValue, row: RowRaw) => Promise<any> | any
}

export interface Column {
  title?: string
  field: string
  type?: ValueType
  width?: number
  component?: ColumnComponent
  preview?: ColumnComponent
  componentProps?: ColumnComponentProps
  componentListeners?: ColumnConponentListeners
  default?: CellValue | (() => CellValue)
  enum?: Options
  rule?: Rule
  hidden?: boolean
  virtual?: boolean
  effects?: {
    [eventName: string]: (...args: EventContext) => void
  }
}
