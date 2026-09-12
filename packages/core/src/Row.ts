import { cloneDeep, isBoolean, isFunction, isUndefined, mapValues, omit } from 'lodash-es'
import { shallowRef, watch, watchEffect, markRaw, type ShallowRef, type WatchStopHandle } from 'vue'
import {
  Column,
  RowRaw,
  CellValue,
  RowRaws,
  Rule,
  Filter,
  StaticComponentProps,
  RowProxy,
  RowErrors,
} from './types'
import { Cell } from './Cell'
import type { Worktable } from './Worktable'
import { makeRowProxy, noThrow, walk, getDefaultValue } from './share'
import type { RuleItem } from 'async-validator'
import ValidateSchema from 'async-validator'
import { FIELD_EVENT_NAME } from './event'
import { deconstruct } from './field-parser'

type CellBoolState = 'previewing' | 'loading' | 'validating'
export class Row {
  static rid = 1
  rid: number
  data: Record<string, Cell> = {}
  parent?: Row
  columns: Column[]
  disposers: Array<() => void> = []
  initialData: Record<string, any> = {}
  private wt?: Worktable

  // 响应式字段
  private _children: ShallowRef<Row[]>
  private _rIndex: ShallowRef<number>

  get children(): Row[] {
    return this._children.value
  }
  set children(val: Row[]) {
    this._children.value = val
  }

  get rIndex(): number {
    return this._rIndex.value
  }
  set rIndex(val: number) {
    this._rIndex.value = val
  }

  static generateRows(columns: Column[], raws: RowRaws, parent?: Row, wt?: Worktable) {
    return raws.map((raw, index) => {
      const row = new Row(columns, raw, parent, index, wt)
      return row
    })
  }

  constructor(columns: Column[], raw: RowRaw = {}, parent?: Row, rIndex = 0, wt?: Worktable) {
    this._children = shallowRef([])
    this._rIndex = shallowRef(rIndex)

    this.wt = wt
    this.rid = Row.rid++
    this.columns = columns
    this.parent = parent
    this.initialData = cloneDeep(raw)
    this.generate(raw)
    Object.values(this.data).forEach((cell) => {
      // track dynamic value
      cell.trackDynamicValue()
      // setup onFieldReact effect
      cell.setupOnFieldReactEffect()
    })

    // notify value initialization event
    this.notifyCellInitializationEvent()
    this.trackRowValidateHandle()

    // 与 Cell 同理，标记 raw 阻止 vue 对 Row 二次 reactive 代理（保护 children/rIndex 的 shallowRef）。
    return markRaw(this)
  }

  getShallowRaw() {
    let raw: Record<string, any> = {}
    for (const k in this.data) {
      if (!this.data[k].colDef.virtual) {
        raw[k] = this.data[k].cellValue
      }
    }
    const virtualKeys = [
      'children',
      ...this.columns.filter((colDef) => colDef.virtual).map((colDef) => colDef.field),
    ]
    raw = Object.assign(omit(this.initialData || {}, virtualKeys), raw)
    return raw
  }

  getRaw() {
    const raw = this.getShallowRaw()
    if (this.children.length > 0) {
      raw.children = this.children.map((child) => child.getRaw())
    }
    return raw
  }

  setValues(raw: Record<string, any>) {
    Object.keys(raw).forEach((key) => {
      if (this.data[key]) {
        this.data[key].setState('value', raw[key])
      } else {
        Object.assign(this.initialData, { [key]: raw[key] })
      }
    })
  }

  addRow(raw?: RowRaw): RowProxy {
    const row = new Row(this.columns, raw, this, 0, this.wt)
    row.rIndex = this.children.length
    this.children = [...this.children, row]
    this.wt?.updateRowsMap()
    return makeRowProxy(row)
  }

  addRows(raws: RowRaw[] = []): RowProxy[] {
    // 批量构建后一次性赋值 children，保证只触发一次响应式通知
    const newRows = raws.map((raw) => new Row(this.columns, raw, this, 0, this.wt))
    if (newRows.length > 0) {
      const startIndex = this.children.length
      newRows.forEach((row, i) => (row.rIndex = startIndex + i))
      this.children = [...this.children, ...newRows]
      this.wt?.updateRowsMap()
    }
    return newRows.map((row) => makeRowProxy(row))
  }

  remove(rid: number): void
  remove(filter: Filter): void
  remove(filter: any): void {
    if (typeof filter === 'number') {
      filter = (row: Row) => row.rid === filter
    }
    const rows: Row[] = this.findAll(filter as Filter)
    rows.forEach((row) => this.removeRow(row))
  }

  removeRow(row: Row) {
    const workRows = this.children
    const index = workRows.findIndex((r) => r === row)
    if (index > -1) {
      const next = workRows.slice()
      const [removed] = next.splice(index, 1)
      // 先重置 rIndex，再赋值触发响应式通知
      next.forEach((row, index) => (row.rIndex = index))
      this.children = next
      this.wt?.updateRowsMap()
      removed.teardown()
    }
  }

  removeAll() {
    this.remove(() => true)
  }

  removeSelf() {
    this.wt?.remove(this.rid)
    this.wt?.updateRowsMap()
  }

  sort(comparator: (a: RowProxy, b: RowProxy) => number) {
    this.children = this.children
      .slice()
      .sort((arow, brow) => comparator(makeRowProxy(arow), makeRowProxy(brow)))
  }

  teardown() {
    this.disposers.forEach((disposer) => disposer())
    this.disposers = []
    // dispose cells in this row
    Object.values(this.data).forEach((cell) => cell.teardown())
    // dispose children
    this.children.forEach((child) => child.teardown())
  }

  validate() {
    const validators: Promise<boolean>[] = []
    for (const field in this.data) {
      validators.push(this.validateCell(this.data[field], true))
    }
    return Promise.all(validators)
  }

  setComponentProps(field: string, extralProps: StaticComponentProps) {
    return this.data[field]?.setComponentProps(extralProps)
  }

  reset(field?: string | string[]) {
    if (field) {
      const fields = Array.isArray(field) ? field : [field]
      fields.forEach((field) => this.data[field]?.reset())
    } else {
      // reset all
      Object.values(this.data).forEach((cell) => cell.reset())
    }
  }

  setLoading(loading: boolean): void
  setLoading(field: string | string[], loading: boolean): void
  setLoading(field?: any, loading?: boolean) {
    if (typeof field === 'boolean') {
      loading = field
      field = Object.keys(this.data)
    }

    this.setBoolState(field, 'loading', !!loading)
  }

  get errors(): RowErrors {
    return mapValues(this.data, (cell) => cell.errors)
  }

  private setBoolState(field: string | string[], state: CellBoolState, val: boolean) {
    if (field) {
      const fields = Array.isArray(field) ? field : [field]
      fields.forEach((field) => this.data[field]?.setState(state, val))
    } else {
      // set all cells loading
      Object.values(this.data).forEach((cell) => cell.setState(state, val))
    }
  }

  private notifyCellInitializationEvent() {
    Object.values(this.data).forEach((cell) => {
      cell.notifyValueFieldEvent(FIELD_EVENT_NAME.ON_FIELD_INIT)
    })
  }

  private findAll(filter: Filter) {
    const rows: Row[] = []
    walk(this.children, (row) => {
      if (filter(makeRowProxy(row))) {
        rows.push(row)
      }
    })
    return rows
  }

  private trackRowValidateHandle() {
    for (const field in this.data) {
      const disposer = this.trackCellValidateHandle(this.data[field])
      this.disposers.push(disposer)
    }
  }

  /**
   * 监听 cell 校验依赖，变化即重新校验（对齐 mobx 的 Reaction 模型）。
   *
   * 用单个 watchEffect 承载 validateCell：effect 每次重跑时既做真校验、又顺带
   * 重新收集依赖——validateCell 同步段会读取 cellValue（本 cell 依赖），其内部
   * asyncValidator 同步调用用户 validator 时会读取跨字段值（如 row.data.isGroup，
   * 跨字段依赖）。任一依赖变化即触发 effect 重跑校验。这与 mobx 版本
   * `reaction.track(() => validator())` 完全同构（一次执行 = 校验 + 依赖收集），
   * 避免「source 探测 + callback 校验」双次执行导致 validator 被重复调用。
   *
   * flush 用 'pre' 而非 'sync'：校验常因 onFieldReact 等计算值 effect 写入而间接
   * 触发。'pre' 将其推迟到外层同步代码跑完后的独立时机执行，避免嵌套调度下校验
   * 内的依赖读取被外层 effect 误收集（core 测试均有 await delay 等待校验完成）。
   */
  private trackCellValidateHandle(cell: Cell) {
    const validator = noThrow(() => this.validateCell(cell))
    const stop: WatchStopHandle = watchEffect(() => validator(), { flush: 'pre' })
    return stop
  }

  private validateCell(cell: Cell, force = false) {
    const colDef = cell.colDef
    // skip the validation of hidden field
    if (colDef.hidden) {
      cell.setState('errors', [])
      return Promise.resolve(true)
    }

    const needEmitError = cell.modified || force
    const descriptor = this.makeCellVaidateDescriptor(colDef)
    // target 读取响应式 cellValue，使 watchEffect 能收集到本 cell 值的依赖；
    // 其余场景（notify、errors）用 peek 读取，避免校验过程对 errors 等产生多余依赖。
    const target = { [colDef.field]: cell.cellValue }
    cell.setState('validating', true)
    const validator = new ValidateSchema(descriptor)
    if (needEmitError) {
      this.wt?.notifyFieldEvent(
        colDef.field,
        FIELD_EVENT_NAME.ON_FIELD_VALUE_VALIDATE_START,
        cell.peekCellValue(),
        makeRowProxy(this)
      )
    }
    return validator
      .validate(target)
      .then(() => {
        if (cell.peekErrors().length > 0) {
          cell.setState('errors', [])
        }
        if (needEmitError) {
          this.wt?.notifyFieldEvent(
            colDef.field,
            FIELD_EVENT_NAME.ON_FIELD_VALUE_VALIDATE_SUCCESS,
            cell.peekCellValue(),
            makeRowProxy(this)
          )
        }
        return true
      })
      .catch((err) => {
        if (needEmitError) {
          const errors = err.errors.map((err: any) => err.message)
          cell.setState('errors', errors)
          this.wt?.notifyFieldEvent(
            colDef.field,
            FIELD_EVENT_NAME.ON_FIELD_VALUE_VALIDATE_FAIL,
            cell.peekCellValue(),
            makeRowProxy(this),
            errors
          )
        }
        throw err
      })
      .finally(() => {
        cell.setState('validating', false)
        if (needEmitError) {
          this.wt?.notifyFieldEvent(
            colDef.field,
            FIELD_EVENT_NAME.ON_FIELD_VALUE_VALIDATE_FINISH,
            cell.peekCellValue(),
            makeRowProxy(this)
          )
        }
      })
  }

  private generate(raw: RowRaw) {
    this.columns.forEach((col) => {
      if (!col.field) return
      const val = raw?.[col.field] as CellValue
      const cell = Cell.generateBaseCell({
        parent: this,
        colDef: col,
        value: isUndefined(val) ? getDefaultValue(col.default) : val,
        evProxy: this.wt,
      })
      cell.position.field = col.field
      this.data[col.field] = cell
    })

    // bind deconstructed fields
    Object.entries(this.data).forEach(([field, cell]) => {
      const meta = deconstruct(field)
      if (meta) {
        cell.deconstructedType = meta.type
        meta.keyMaps.forEach(([from, to]) => {
          cell.deconstructedCells[from] = this.data[to]
        })
        cell.value = cell.mergeValue()
      }
    })

    if (Array.isArray(raw?.children)) {
      this.children = Row.generateRows(this.columns, raw!.children!, this, this.wt)
    }
  }

  private makeCellVaidateDescriptor(colDef: Column) {
    const descriptor: Record<string, RuleItem[]> = {
      [colDef.field]: [],
    }
    if (colDef.required) {
      descriptor[colDef.field].push({
        type: colDef.type,
        required: true,
        message: colDef.requiredMessage || 'This field is required',
      })
    }
    const rules = this.getRules(colDef)
    descriptor[colDef.field].push(...rules)
    return descriptor
  }

  private makeCellAsyncVaidatorFn(rule: Rule) {
    const rowProxy = makeRowProxy(this)
    return async (_: any, value: any) => {
      const success = await rule.validator?.(value, rowProxy)
      if (isBoolean(success) && !success) {
        return Promise.reject(rule.message || 'validate error')
      }
    }
  }

  private getRules(colDef: Column): Array<Omit<RuleItem, 'transform' | 'validator'>> {
    let rules = colDef.rule
    if (!rules) return []
    if (!Array.isArray(rules)) {
      rules = [rules]
    }

    return rules.map((rule) => {
      const ruleItem = omit(rule, ['transform', 'asyncValidator', 'validator'])
      ruleItem.type = rule.type || colDef.type
      if (isFunction(rule.validator)) {
        Object.assign(ruleItem, {
          asyncValidator: this.makeCellAsyncVaidatorFn(rule),
        })
      }
      return ruleItem
    })
  }
}
