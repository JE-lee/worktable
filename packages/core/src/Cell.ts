import { FIELD_EVENT_NAME, TABLE_EVENT_NAME } from './event'
import {
  CellState,
  CellStateValue,
  CellValue,
  Column,
  CellFactoryContext,
  StaticComponentProps,
  CellPosition,
  RowProxy,
  TableEventBridge,
} from './types'
import { isUndefined, isEqual, cloneDeep, isFunction, get, set } from 'lodash-es'
import { shallowRef, watchEffect, watch, markRaw, type ShallowRef, type WatchStopHandle } from 'vue'
import { Row } from './Row'
import { makeRowProxy, getDefaultByValueType, getDefaultValue } from './share'

export class Cell {
  parent: Row
  modified = false
  position: CellPosition
  colDef: Column
  evProxy?: TableEventBridge
  deconstructedType = ''
  deconstructedCells: Record<string, Cell> = {} // deconstructed fields
  disposers: (() => void)[] = [] // stop handles of watchers

  // 响应式字段，用 shallowRef 持有，通过 getter/setter 暴露原属性访问方式，
  // 使得 cell.value / cell.errors 等的读写 API 与 mobx 版本一致。
  private _value: ShallowRef<CellValue>
  // value 的非响应式镜像：供 notify 等场景读取当前值而不触发依赖收集。
  // 否则在 onFieldReact 等 effect 内「读 A 写 B」时，写 B 触发的 notify 读取 B 值
  // 会被误收集为该 effect 的依赖，导致 effect 被自身写入重入（mobx 版本无此问题）。
  private _rawValue: CellValue
  // errors 的非响应式镜像，作用同 _rawValue（供 validate 内读取而不产生依赖收集）。
  private _rawErrors: string[] = []
  private _errors: ShallowRef<string[]>
  private _staticComponentProps: ShallowRef<StaticComponentProps>
  private _previewing: ShallowRef<boolean>
  private _validating: ShallowRef<boolean>
  private _loading: ShallowRef<boolean>

  get value(): CellValue {
    return this._value.value
  }
  set value(val: CellValue) {
    this._rawValue = val
    this._value.value = val
  }

  get errors(): string[] {
    return this._errors.value
  }
  set errors(val: string[]) {
    this._rawErrors = val
    this._errors.value = val
  }

  /** 非响应式读取 errors（基于 _rawErrors 镜像） */
  peekErrors(): string[] {
    return this._rawErrors
  }

  get staticComponentProps(): StaticComponentProps {
    return this._staticComponentProps.value
  }
  set staticComponentProps(val: StaticComponentProps) {
    this._staticComponentProps.value = val
  }

  get previewing(): boolean {
    return this._previewing.value
  }
  set previewing(val: boolean) {
    this._previewing.value = val
  }

  get validating(): boolean {
    return this._validating.value
  }
  set validating(val: boolean) {
    this._validating.value = val
  }

  get loading(): boolean {
    return this._loading.value
  }
  set loading(val: boolean) {
    this._loading.value = val
  }

  get cellValue() {
    return this.computeCellValue(this.value)
  }

  /** 非响应式地读取 cellValue（基于 _rawValue 镜像），供 notify / validate 等场景使用。
   *  这些场景只需要当前值而不应产生依赖收集；尤其在 vue sync watcher 嵌套调度下，
   *  若在校验回调里读取响应式 value，会被外层正在运行的 effect（如 onFieldReact）
   *  误收集为依赖，导致该 cell 被错误地纳入外层 effect 的依赖而反复重入。 */
  peekCellValue() {
    return this.computeCellValue(this._rawValue)
  }

  private computeCellValue(value: CellValue) {
    if (this.colDef.type === 'number') {
      if (typeof value === 'string' && value.length > 0) {
        return Number(value)
      } else {
        return value // ''
      }
    } else {
      return value
    }
  }

  static generateBaseCell(ctx: CellFactoryContext) {
    const { value, colDef, parent, evProxy } = ctx
    const formatedValue = isUndefined(value)
      ? getDefaultByValueType(colDef.type || 'string')
      : value
    return new Cell(parent, colDef, formatedValue, evProxy)
  }

  private constructor(parent: Row, colDef: Column, value: CellValue, ev?: TableEventBridge) {
    this.parent = parent
    this.position = { rid: parent.rid, field: colDef.field }
    this.colDef = colDef
    this.evProxy = ev
    this._value = shallowRef(value)
    this._rawValue = value
    this._errors = shallowRef([])
    this._staticComponentProps = shallowRef(
      colDef.componentProps ? { ...colDef.componentProps } : {}
    )
    this._previewing = shallowRef(true)
    this._validating = shallowRef(false)
    this._loading = shallowRef(false)

    // Cell 自带基于 shallowRef 的响应式，标记为 raw 阻止 vue 对其二次 reactive 代理。
    // 否则当被嵌入 ElTable 等组件的响应式数据中时，内部 shallowRef 会被解包，
    // 导致 cell.value / cell.errors 等 getter 失效。
    return markRaw(this)
  }

  setState<S extends CellState>(state: S, val: CellStateValue[S]): void {
    // 仅 value 需要旧值做 isEqual 判断（决定是否触发 change 通知）；且旧值必须从
    // 非响应式镜像 _rawValue 读取，避免在 effect 内写值时把该 cell 误收集为依赖。
    // 其它状态（validating/loading/previewing/errors）无需旧值，直接赋值——
    // 若在 effect（如校验 watchEffect）内读取它们的响应式旧值，会被收集为依赖，
    // 而 setState 又会改写它们，从而造成 effect 自我触发死循环。
    if (state === 'value') {
      const prev = this._rawValue
      const isValueChange = !isEqual(prev, val)
      // modified 需在写入 value 之前置位：写入 value 会触发校验 watcher，
      // 后者依据 cell.modified 决定是否 emit 校验错误事件。
      if (isValueChange) {
        this.modified = true
      }
      this.value = val as CellValue
      if (isValueChange) {
        this.deconstructValue()
        this.notifyValueFieldEvent(FIELD_EVENT_NAME.ON_FIELD_VALUE_CHANGE)
        this.notifyValueTableEvent(TABLE_EVENT_NAME.ON_FIELD_VALUE_CHANGE)
      }
    } else {
      this[state] = val as any
    }
  }

  setComponentProps(extralProps: StaticComponentProps) {
    this.staticComponentProps = Object.assign({}, this.staticComponentProps, extralProps)
  }

  trackDynamicValue() {
    if (isFunction(this.colDef.value)) {
      this.track((row: RowProxy) => this.setState('value', this.colDef.value!(row)), null, true)
    }
  }

  setupOnFieldReactEffect() {
    const onFieldReact = this.colDef.effects?.[FIELD_EVENT_NAME.ON_FIELD_REACT]
    if (Array.isArray(onFieldReact)) {
      const [tracker, reactor] = onFieldReact
      this.track(reactor, tracker)
    } else if (typeof onFieldReact === 'function') {
      this.track((row: RowProxy) => onFieldReact(row), null)
    }
  }

  notifyValueFieldEvent(eventName: FIELD_EVENT_NAME) {
    const val = cloneDeep(this.peekCellValue())
    const rowProxy = makeRowProxy(this.parent)
    this.evProxy?.notifyFieldEvent(this.colDef.field, eventName, val, rowProxy)
  }

  notifyValueTableEvent(eventName: TABLE_EVENT_NAME) {
    const val = cloneDeep(this.peekCellValue())
    const rowProxy = makeRowProxy(this.parent)
    this.evProxy?.notifyTableFieldEvent(eventName, val, rowProxy)
  }

  deconstructValue() {
    // set value of deconstructed cells
    Object.entries(this.deconstructedCells).forEach(([from, cell]) => {
      cell.setState('value', get(this.value, from))
    })
  }

  mergeValue() {
    if (this.deconstructedType !== 'object' && this.deconstructedType !== 'array') return this.value
    let merged: object
    if (this.deconstructedType === 'object') {
      merged = {}
    } else {
      merged = []
    }

    Object.entries(this.deconstructedCells).forEach(([from, cell]) => {
      set(merged, from, cell.value)
    })
    return merged as CellValue
  }

  reset() {
    if (!this.deconstructedType) {
      const defaultValue = this.colDef.default
        ? getDefaultValue(this.colDef.default)
        : getDefaultByValueType(this.colDef.type)
      this.setState('value', defaultValue)
    } else {
      Object.values(this.deconstructedCells).forEach((cell) => cell.reset())
      this.setState('value', this.mergeValue())
    }
  }

  teardown() {
    this.deconstructedCells = {}
    this.disposers.forEach((disposer) => disposer())
    this.disposers = []
  }

  /**
   * 复刻 mobx Reaction 的同步依赖追踪语义：
   * - 无 tracker 时，等价于 watchEffect(reactor, { flush: 'sync' })，
   *   自动收集 reactor 内访问到的响应式依赖，变化时同步重跑。
   * - 有 tracker 时，等价于 watch(tracker, reactor, { flush: 'sync' })，
   *   仅当 tracker 返回值变化时触发 reactor（首次不触发）。
   */
  private track(
    reactor: (row: RowProxy) => void,
    tracker: ((row: RowProxy) => unknown) | null,
    rowImmutable = false
  ) {
    const row = this.parent
    const rowProxy = makeRowProxy(row, rowImmutable)
    let stop: WatchStopHandle
    if (!tracker) {
      stop = watchEffect(() => reactor(rowProxy), { flush: 'sync' })
    } else {
      stop = watch(
        () => tracker(rowProxy),
        () => reactor(rowProxy),
        { flush: 'sync' }
      )
    }
    this.disposers.push(stop)
  }
}
