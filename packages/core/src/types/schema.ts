import { RuleItem } from 'async-validator'

export type ValueType = 'boolean' | 'string' | 'number' | 'object' | 'array'

type BaseCellValue = string | number | boolean

export type CellValue = BaseCellValue | Record<string, BaseCellValue> | Array<BaseCellValue>

export interface CellPosition {
  rid: number // row id
  field: string // colomn field
}

export type Row = {
  data: Record<string, Cell>
  initialData?: Record<string, any>
  rid: number // row id
  children: Row[]
  rIndex: number
  parent?: Row
}

export type Rows = Row[]

export type RowRaw = {
  [field: string]: CellValue
} & { children?: RowRaw[] }

export type RowRaws = Array<RowRaw>

export type AutoRunContext = { value: CellValue; row: RowRaw }

export type EventContext = AutoRunContext

export type AsyncValidatorContext = AutoRunContext

export interface Cell {
  value: CellValue
  previewing: boolean
  validating: boolean
  errors: string[]
  position: CellPosition
}

type ColumnComponent = any

type ColumnComponentProps = Record<string, any> | ((context: AutoRunContext) => Record<string, any>)

export type Rule = Omit<RuleItem, 'transform' | 'asyncValidator' | 'validator'> & {
  validator?: (context: AsyncValidatorContext) => Promise<any>
}

export interface Column {
  title?: string
  field: string
  type?: ValueType
  // width?: number
  component?: ColumnComponent
  preview?: ColumnComponent
  componentProps?: ColumnComponentProps
  default?: CellValue | (() => CellValue)
  // enum?: Options
  rule?: Rule
  hidden?: boolean
  virtual?: boolean
  effects?: {
    [eventName: string]: (context: EventContext) => void
  }
}
