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

export type AutoRunContext = { value: CellValue; row: RowRaw }

export type EventContext = AutoRunContext

export type AsyncValidatorContext = AutoRunContext

type ColumnComponent = any

type ColumnComponentProps = Record<string, any> | ((context: AutoRunContext) => Record<string, any>)

export type Rule = Omit<RuleItem, 'transform' | 'asyncValidator' | 'validator'> & {
  validator?: (context: AsyncValidatorContext) => Promise<any> | any
}

export interface Column {
  title?: string
  field: string
  type?: ValueType
  width?: number
  component?: ColumnComponent
  preview?: ColumnComponent
  componentProps?: ColumnComponentProps
  default?: CellValue | (() => CellValue)
  enum?: Options
  rule?: Rule
  hidden?: boolean
  virtual?: boolean
  effects?: {
    [eventName: string]: (context: EventContext) => void
  }
}
