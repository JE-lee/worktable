import type { Row } from '../Row'
import { CellValue, Column, RowProxy, RowRaws, CellErrors } from './schema'
import { FIELD_EVENT_NAME, TABLE_EVENT_NAME } from '../event'

export interface WorktableConstructorOpt {
  columns: Column[]
  initialData?: RowRaws
}

export type CellState = 'value' | 'previewing' | 'validating' | 'errors' | 'loading'

/** Cell 各状态字段对应的值类型，用于 setState 的类型安全调用 */
export type CellStateValue = {
  value: CellValue
  previewing: boolean
  validating: boolean
  errors: string[]
  loading: boolean
}

export type Filter = (row: RowProxy) => boolean

/**
 * 表格侧向 Cell 提供的事件桥接能力。
 * 由 Worktable 实现，Cell 通过它向外派发字段级 / 表级「值变化」事件。
 * （原类型直接是 EventEmitter 类，继承改组合后这里抽成最小接口以解耦。）
 */
export interface TableEventBridge {
  notifyFieldEvent(
    field: string,
    eventName: FIELD_EVENT_NAME,
    val: CellValue,
    row: RowProxy,
    errors?: CellErrors
  ): void
  notifyTableFieldEvent(
    eventName: TABLE_EVENT_NAME,
    val: CellValue,
    row: RowProxy,
    errors?: CellErrors
  ): void
}

export type CellFactoryContext = {
  parent: Row
  colDef: Column
  evProxy?: TableEventBridge
  value?: CellValue
}

export type StaticComponentProps = Record<string, any>

export type FieldDeconstructMeta = {
  type: 'array' | 'object'
  keyMaps: Array<[string, string]>
}
