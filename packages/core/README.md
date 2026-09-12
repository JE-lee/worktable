# @edsheet/core

可编辑表格（Editable Table）的**框架无关数据内核**。

`@edsheet/core` 不渲染任何 UI，它只负责可编辑表格里最难的那部分：以声明式的列配置（Column Schema）为单一事实来源，驱动整个表格的**数据模型、响应式联动、异步校验、树形结构与编辑状态**。你可以在它之上接入任意渲染层（官方提供 [`@edsheet/element-ui`](https://je-lee.github.io/worktable/element-ui/)），也可以自建。

## 为什么选择它

可编辑表格真正的复杂度不在"画一张表"，而在：

- **联动**：B 列 = f(A 列)、C 列的禁用/选项依赖 D 列、勾选 isGroup 后 count 的校验规则立刻变化……
- **校验**：单元格校验、跨字段校验、异步校验，输入即校验且错误状态精确到单元格。
- **状态**：每个单元格独立的 `value / previewing / validating / loading / errors / modified`。
- **结构**：树形（父子）行、一个 UI 字段拆成多个后端字段（或反向合并）。

`@edsheet/core` 用一套响应式模型把这几件事统一掉：你只声明"列长什么样、值怎么算、怎么校验"，联动与校验的时机由内核自动推导。

## 安装

```bash
npm install @edsheet/core
# 响应式依赖（peer）
npm install vue@^2.7.0
```

> 内核基于 `vue@2.7` 的响应式 API（`shallowRef / watchEffect / watch`）实现，因此 `vue` 是其 `peerDependency`。如果你的渲染层是 Vue 2.7+，它与你应用共享同一套响应式系统，单元格变更可直接驱动视图更新。

## 快速上手

```ts
import { Worktable, FIELD_EVENT_NAME } from '@edsheet/core'

const worktable = new Worktable({
  columns: [
    { field: 'price', title: '单价', type: 'number', required: true },
    { field: 'count', title: '数量', type: 'number', required: true },
    {
      field: 'total',
      title: '总价',
      type: 'number',
      // 计算列：依赖 price / count，自动联动
      value: (row) => (row.data.price as number) * (row.data.count as number),
    },
  ],
  initialData: [{ price: 10, count: 2 }],
})

// 读数据
worktable.getData() // => [{ price: 10, count: 2, total: 20 }]

// 改一个单元格，联动与校验自动发生
const row = worktable.getRow(worktable.rows[0].rid)!
worktable.inputValue({ rid: row.rid, field: 'count' }, 5)
worktable.getData() // => [{ price: 10, count: 5, total: 50 }]

// 校验
await worktable.validate().catch((err) => err.errors)
```

## 核心概念

### Worktable

`Worktable` 是一张表的根。构造它只需要一份列配置和可选的初始数据：

```ts
// 传配置对象
new Worktable({ columns, initialData })
// 或只传列
new Worktable(columns)
```

它持有 `columns`、`rows`，暴露行增删改查、排序、校验、列显隐、事件订阅等全部能力。

### Column（列配置）

列是声明式的，一份 `Column` 同时描述数据与行为：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `field` | `string` | 字段名。支持解构语法（见下文「字段解构」） |
| `title` | `string` | 列标题（渲染层使用） |
| `type` | `'boolean'\|'string'\|'number'\|'object'\|'array'` | 值类型，影响默认值与校验 |
| `default` | `CellValue \| (() => CellValue)` | 新增行时的默认值 |
| `value` | `(row) => CellValue` | **计算列**：自动追踪依赖并联动 |
| `required` | `boolean` | 必填（配合 `requiredMessage`） |
| `rule` | `Rule \| Rule[]` | 校验规则（基于 async-validator，含跨字段 validator） |
| `effects` | `object` | 字段级事件/联动（见「联动」） |
| `hidden` | `boolean` | 隐藏列（隐藏后跳过校验） |
| `virtual` | `boolean` | 虚拟列（不进入 `getData()` 结果） |
| `disabled` | `boolean \| ((row) => boolean)` | 禁用（渲染层使用） |
| `component` / `preview` | — | 指定编辑/预览组件（渲染层使用） |
| `componentProps` | `object \| ((row) => object)` | 组件 props（渲染层使用） |
| `enum` | `Options` | 枚举选项（渲染层使用） |

### RowProxy（行代理）

对行的操作几乎都通过 `RowProxy` 进行——它是一个 Proxy，把 `data` 的读写桥接到内部单元格状态机，同时挂载行级动作：

```ts
const row = worktable.add({ price: 3, count: 4 })

row.rid                 // 行 id
row.index               // 在兄弟节点中的下标（响应式）
row.data.total          // 读单元格值（计算列 => 12）
row.data.count = 10     // 写单元格值（触发联动与校验）
row.errors              // 该行各字段的校验错误 { [field]: string[] }

row.addRow({ ... })     // 添加子行
row.removeSelf()        // 删除自身
row.setValues({ count: 1, price: 2 }) // 批量赋值
row.getValues()         // 取整行原始数据
row.reset()             // 重置为默认值
row.setLoading(true)    // 置 loading
```

> 在 `sort` / `filter` / `find` 等回调里，内核传入的是**不可变** `RowProxy`，对其 `data` 赋值不会生效（防止在遍历比较中误改数据）。

## 联动

内核用响应式自动追踪依赖，你无需手动订阅"哪个字段变了要刷新谁"。

### 计算列（`value`）

最常用：声明一个由其它字段推导的列。

```ts
{ field: 'total', value: (row) => row.data.price * row.data.count }
```

`price` 或 `count` 变化时，`total` 自动重算。

### `effects.onFieldReact`（自定义联动）

当联动不只是赋值（比如联动禁用、清空、拉取选项）时，用 `onFieldReact`：

```ts
{
  field: 'city',
  effects: {
    // 只要 province 变化就清空并重新加载 city
    onFieldReact: (row) => {
      const province = row.data.province
      row.reset('city')
      loadCities(province).then((list) => row.setComponentProps('city', { options: list }))
    },
  },
}
```

`onFieldReact` 会自动收集函数体内读到的依赖字段，任一变化即重跑。也可以用 `[tracker, reactor]` 元组**显式指定**依赖，只有 tracker 返回值变化才触发 reactor：

```ts
effects: {
  onFieldReact: [
    (row) => row.data.province,           // tracker：只关心 province
    (row) => { /* reactor：province 变了才执行 */ },
  ],
}
```

### 字段值变化事件（`effects.onFieldValueChange` 等）

更细粒度的事件监听：

```ts
effects: {
  onFieldInit: (val, row) => {},
  onFieldValueChange: (val, row) => {},
  onFieldValueValidateFail: (val, row, errors) => {},
}
```

也可以在表级订阅（见「事件」）。

## 校验

校验基于 [`async-validator`](https://github.com/yiminghe/async-validator)，**输入即自动校验**，错误状态精确到单元格。

### 必填

```ts
{ field: 'code', required: true, requiredMessage: '编码必填' }
```

### 规则（含跨字段、异步）

`rule.validator(value, row)` 可返回布尔 / 抛错 / 返回 Promise，且能读取**其它字段**——内核会自动把这些跨字段读取纳入依赖，相关字段变化时自动重新校验：

```ts
{
  field: 'count',
  type: 'number',
  rule: {
    validator(val, row) {
      if (val <= 0) throw '必须是正数'
      // 跨字段：isGroup 变化会触发 count 重新校验
      if (row.data.isGroup && val > 1) throw '组合商品数量不能大于 1'
    },
  },
}
```

支持 `Rule[]` 多规则（按序短路）。

### 触发与读取

```ts
// 手动触发全表校验；resolve 为原始数据，reject 为 ValidateError
worktable
  .validate()
  .then((rows) => /* 校验通过，rows 为 getData() 结果 */)
  .catch((err) => {
    err instanceof ValidateError
    err.errors // => Array<{ [field]: string[] }>，按行排列的结构化错误
  })

// 不抛错地读取当前错误快照
worktable.getValidateErrors()

// 隐藏列自动跳过校验
worktable.toggleColumnVisibility('code', false)
```

## 树形数据

数据里带 `children` 即成为父子结构，所有操作天然支持递归：

```ts
const worktable = new Worktable({
  columns,
  initialData: [
    { name: 'parent', children: [{ name: 'child-1' }, { name: 'child-2' }] },
  ],
})

const parent = worktable.find((row) => row.data.name === 'parent')!
const child = parent.addRow({ name: 'child-3' }) // 添加子行
child.parent === parent                          // 父引用
worktable.getData() // 保留 children 结构
```

`find` / `findAll` / `walk` / `forEach` / 校验都会遍历整棵树。

## 字段解构（一个 UI 字段 ↔ 多个数据字段）

后端一个对象/数组字段，在表格里往往需要拆成几列展示与编辑；反之亦然。用 `field` 的解构语法声明，内核自动做双向合并/拆分，且 `getData()` 仍输出后端需要的结构：

```ts
// 对象：product 列编辑 productCode / productName 两个真实字段
{ field: '{productCode, productName}', component: ProductSelect }

// 数组：[startDate, endDate] 列编辑两个真实字段
{ field: '[startDate, endDate]', component: RangePicker }
```

- `getData()` 输出 `{ productCode, productName }`（或数组），**不**包含解构字段本身。
- 也可写映射形式 `'{code: productCode}'`：UI 列名为 `code`，映射到数据字段 `productCode`。

## 事件

表级事件用 `addEffect` 订阅，字段级事件用 `addFieldEffect` 订阅，均**返回取消订阅函数**：

```ts
import { TABLE_EVENT_NAME, FIELD_EVENT_NAME } from '@edsheet/core'

// 表级：任意字段值变化 / 校验流程
const off = worktable.addEffect(TABLE_EVENT_NAME.ON_FIELD_VALUE_CHANGE, (val, row) => {})
worktable.addEffect(TABLE_EVENT_NAME.ON_VALIDATE_FAIL, (errors) => {})

// 字段级
const offField = worktable.addFieldEffect('count', FIELD_EVENT_NAME.ON_FIELD_VALUE_CHANGE, (val, row) => {})

off()       // 取消订阅
offField()

// 批量赋值时临时暂停 / 恢复 effect 触发
worktable.pauseEffects()
worktable.setValuesInEach({ count: 0 })
worktable.resumeEffects()
```

字段级事件名（`FIELD_EVENT_NAME`）：`onFieldInit` `onFieldValueChange` `onFieldInputValueChange` `onFieldValueValidateStart/Success/Fail/Finish` `onFieldReact`。

表级事件名（`TABLE_EVENT_NAME`）：`onFieldValueChange` `onFieldInputValueChange` `onValidateStart/Success/Fail/Finish`。

## API 参考

以下签名均为 TypeScript 类型。`Worktable` 同时支持 `new Worktable(columns: Column[])` 与 `new Worktable(opt: WorktableConstructorOpt)` 两种构造形式。

### 数据读写

```ts
// 全表原始数据（含 children，剔除 virtual / 解构字段）
getData(): RowRaw[]
// 重置并填入数据
setData(rows: RowRaw | RowRaw[]): void
// 以"输入"语义写单元格；除 ON_FIELD_VALUE_CHANGE 外额外触发 ON_FIELD_INPUT_VALUE_CHANGE。
// 目标单元格不存在时返回 false
inputValue(position: CellPosition, value: CellValue): boolean
// 对匹配行批量赋值；raw 为对象时直接合并，为函数时先求值（入参为不可变 RowProxy）
setValuesInEach(raw: Record<string, any>, filter?: Filter): void
setValuesInEach(raw: (row: RowProxy) => Record<string, any>, filter?: Filter): void
```

### 行操作

```ts
// 添加一行，返回该行的 RowProxy
add(raw?: RowRaw): RowProxy
add(raw: RowRaw[]): RowProxy[]
addRow(raw?: RowRaw): RowProxy
// 批量添加（单次响应式通知），返回 RowProxy[]
addRows(raws: RowRaws): RowProxy[]
// 按 rid 或条件删除
remove(rid: number): void
remove(filter: Filter): void
// 删除全部行
removeAll(): void
// 顶级行排序；comparator 收到的是不可变 RowProxy
sort(comparator: (a: RowProxy, b: RowProxy) => number): void
// 对每个匹配行的子行分别排序
sortChildInEach(comparator: (a: RowProxy, b: RowProxy) => number, filter: Filter): void
```

### 查询与遍历（均递归整棵树，返回 RowProxy）

```ts
getRow(rid: number): RowProxy | null
find(filter: Filter): RowProxy | null
findAll(filter?: Filter): RowProxy[]
filter(filter: Filter): RowProxy[]       // findAll 的别名
forEach(processor: (row: RowProxy) => void): void
walk(processor: (row: RowProxy) => void): void
```

### 校验

```ts
// 全表校验。resolve 为 getData() 结果；reject 为 ValidateError（err.errors 为结构化错误）
validate(): Promise<RowRaw[]>
submit(): Promise<RowRaw[]>              // validate 的别名
// 当前错误快照，不触发校验
getValidateErrors(): TableErrors
```

### 列

```ts
// 重设列：保留现有数据并按新列定义重建
setColumns(columns: Column[]): void
// 列显隐；隐藏的列跳过校验
toggleColumnVisibility(fields: string | string[], visible?: boolean): void
// 仅让指定单元格进入编辑态，其余单元格进入预览态
setCellEditable(pos: CellPosition): void
// 批量覆盖某字段所有单元格的组件 props（并写回列定义）
setComponentProps(field: string, externalProps: StaticComponentProps): void
```

### 事件

```ts
// 表级事件；返回取消订阅函数。
// listener 类型随 eventName 收窄：字段值变化类事件为 FieldEffectListener，校验流程类为 TableEffectListener
addEffect<T extends TABLE_EVENT_NAME>(
  eventName: T,
  listener: T extends TABLE_EVENT_NAME.ON_FIELD_VALUE_CHANGE | TABLE_EVENT_NAME.ON_FIELD_INPUT_VALUE_CHANGE
    ? FieldEffectListener
    : TableEffectListener
): () => void
removeEffect(eventName: TABLE_EVENT_NAME, listener?: FieldEffectListener | TableEffectListener): void

// 字段级事件；返回取消订阅函数
addFieldEffect(field: string, eventName: FIELD_EVENT_NAME, listener: FieldEffectListener): () => void
// 不传 eventName 时移除该字段全部事件监听
removeFieldEffect(field: string, eventName?: FIELD_EVENT_NAME, listener?: FieldEffectListener): void

// 暂停 / 恢复 effect 触发（暂停期间的事件会被丢弃，不缓冲）
pauseEffects(): void
resumeEffects(): void
```

### 销毁

```ts
// 清理所有响应式监听与事件订阅；组件卸载时应调用
teardown(): void
```

> 渲染层专用的内部方法：`getRowByRid(rid): Row | undefined`（返回 `Row` 实例）、`getCell(pos): Cell | undefined`。业务代码请优先使用返回 `RowProxy` 的 `getRow` / `find`。

### RowProxy（行代理）

行级动作。`RowProxy` 由 `add` / `addRow` / `find` / `getRow` 等返回，或在 effect / 校验 / 排序回调中作为入参。

```ts
// 只读属性
row.rid: number
row.index: number                 // 在兄弟节点中的下标（响应式）
row.parent: RowProxy | null
row.children: RowProxy[]
row.data: RowRaw                  // 读/写单元格值（写触发联动与校验）
row.errors: RowErrors

// 动作
row.addRow(raw?: RowRaw): RowProxy
row.addRows(raws: RowRaw[]): RowProxy[]
row.removeRow(rid: number): void
row.removeRow(filter: Filter): void
row.removeAllRow(): void          // 删除全部子行
row.removeSelf(): void            // 删除自身
row.setValues(raw: Record<string, any>): void
row.getValues(): RowRaw           // 整行原始数据（含 children）
row.reset(field?: string | string[]): void
row.setLoading(loading: boolean): void
row.setLoading(field: string | string[], loading: boolean): void
row.setComponentProps(field: string, props: StaticComponentProps): void
```

## 类型参考

以下类型均从包入口导出。

### 数据相关

```ts
// 单元格值的类型
type BaseCellValue = string | number | boolean
type BaseObjectCellValue = Record<string, BaseCellValue>
type CellValue =
  | BaseCellValue
  | BaseObjectCellValue
  | Array<BaseCellValue | BaseObjectCellValue>

// 一行的原始数据；children 为可选的树形嵌套
type RowRaw = {
  [field: string]: CellValue | RowRaw[]
} & { children?: RowRaw[] }

type RowRaws = RowRaw[]

// 单元格定位
interface CellPosition {
  rid: number     // 行 id
  field: string   // 列字段名
}

// 值类型（影响默认值与 async-validator 的校验类型）
type ValueType = 'boolean' | 'string' | 'number' | 'object' | 'array'

type Options = Array<{ label: string; value: any }>
```

### 错误相关

```ts
type CellErrors = string[]                       // 单个单元格的错误信息
type RowErrors = Record<string, CellErrors>      // 一行内各字段的错误 { [field]: string[] }
type TableErrors = Array<Record<string, CellErrors>>  // 全表错误，按行排列

// validate() 校验失败时抛出的错误，errors 字段携带结构化结果
class ValidateError extends Error {
  constructor(public errors: TableErrors)
}
```

### 列配置（Column）

```ts
interface Column {
  field: string                                  // 字段名，支持解构语法 '{a,b}' / '[a,b]'
  title?: string
  type?: ValueType
  asterisk?: boolean                             // 渲染层：标题前是否显示必填星号
  required?: boolean
  requiredMessage?: string
  disabled?: boolean | ((row: RowProxy) => boolean)
  component?: ColumnComponent                    // 编辑组件（渲染层）
  preview?: ColumnComponent                      // 预览组件（渲染层）
  componentProps?: ColumnComponentProps          // 组件 props（渲染层）
  componentListeners?: ColumnComponentListeners  // 组件事件（渲染层）
  default?: CellValue | (() => CellValue)        // 新增行默认值
  value?: (row: RowProxy) => CellValue           // 计算列
  enum?: Options
  rule?: Rule | Rule[]
  hidden?: boolean                               // 隐藏列（跳过校验）
  virtual?: boolean                              // 虚拟列（不进入 getData()）
  effects?: {
    [k in FIELD_EVENT_NAME]?: k extends FIELD_EVENT_NAME.ON_FIELD_REACT
      ? OnFieldReactEffectListener | FieldReactEffectListener<unknown>
      : FieldEffectListener
  }
  width?: number
}

type BaseColumnComponent = string | (() => any) | object
type ColumnComponent = BaseColumnComponent | ((row: RowProxy) => BaseColumnComponent)
type ColumnComponentProps = StaticComponentProps | ((row: RowProxy) => StaticComponentProps)
type ColumnComponentListeners = Record<string, (...args: any[]) => void>
type StaticComponentProps = Record<string, any>
```

### 校验规则（Rule）

基于 [`async-validator`](https://github.com/yiminghe/async-validator) 的 `RuleItem`，去掉了 `transform` / `asyncValidator` / `validator`，并新增支持跨字段与 Promise 的 `validator`：

```ts
type Rule = Omit<RuleItem, 'transform' | 'asyncValidator' | 'validator'> & {
  // 返回 false / 抛错 / reject 均视为校验失败；可读取 row 上的其它字段形成跨字段校验
  validator?: (value: CellValue, row: RowProxy) => Promise<any> | any
}
```

### 行代理（RowProxy）

```ts
type RowProxy = {
  parent?: RowProxy
  children: RowProxy[]
  index: number
  rid: number
  data: RowRaw
  errors: RowErrors
} & RowAction

type RowAction = {
  reset(field?: string | string[]): void
  addRow(raw?: RowRaw): RowProxy
  addRows(raws?: RowRaw[]): RowProxy[]
  removeRow(rid: number): void
  removeRow(filter: Filter): void
  removeAllRow(): void
  removeSelf(): void
  setValues(raw: Record<string, any>): void
  getValues(): RowRaw
  setLoading(loading: boolean): void
  setLoading(field: string | string[], loading: boolean): void
  setComponentProps(field: string, props: StaticComponentProps): void
}

// 行过滤 / 查询回调
type Filter = (row: RowProxy) => boolean
```

### 事件相关

```ts
// 字段级事件回调：val 为该字段当前值，row 为所在行代理，errors 仅校验失败时存在
type FieldEffectListener = (val: CellValue, row: RowProxy, errors?: CellErrors) => void
// onFieldReact 的简写形式：自动收集函数体内读取的依赖
type OnFieldReactEffectListener = (row: RowProxy) => void
// onFieldReact 的元组形式：[tracker, reactor]，仅 tracker 返回值变化才触发 reactor
type FieldReactEffectListener<T> = [(row: RowProxy) => T, (row: RowProxy) => void]
// 表级校验流程事件回调
type TableEffectListener = (errors?: TableErrors) => void

// 字段级事件名
enum FIELD_EVENT_NAME {
  ON_FIELD_INIT = 'onFieldInit',
  ON_FIELD_VALUE_CHANGE = 'onFieldValueChange',
  ON_FIELD_INPUT_VALUE_CHANGE = 'onFieldInputValueChange',
  ON_FIELD_VALUE_VALIDATE_START = 'onFieldValueValidateStart',
  ON_FIELD_VALUE_VALIDATE_SUCCESS = 'onFieldValueValidateSuccess',
  ON_FIELD_VALUE_VALIDATE_FAIL = 'onFieldValueValidateFail',
  ON_FIELD_VALUE_VALIDATE_FINISH = 'onFieldValueValidateFinish',
  ON_FIELD_REACT = 'onFieldReact',
}

// 表级事件名
enum TABLE_EVENT_NAME {
  ON_FIELD_VALUE_CHANGE = 'onFieldValueChange',
  ON_FIELD_INPUT_VALUE_CHANGE = 'onFieldInputValueChange',
  ON_VALIDATE_START = 'onValidateStart',
  ON_VALIDATE_SUCCESS = 'onValidateSuccess',
  ON_VALIDATE_FAIL = 'onValidateFail',
  ON_VALIDATE_FINISH = 'onValidateFinish',
}
```

### 构造选项

```ts
interface WorktableConstructorOpt {
  columns: Column[]
  initialData?: RowRaws
}
```

## 渲染层

`@edsheet/core` 自带单元格的编辑态/预览态、loading、错误等状态，但不关心它们如何被画出来。把这些状态接到组件即可：

- 官方实现：[`@edsheet/element-ui`](https://je-lee.github.io/worktable/element-ui/)（Vue 2 + element-ui，含 AgGrid 大数据量版本）。
- 自建：读取 `cell.value / cell.previewing / cell.loading / cell.errors`，结合列上的 `component / componentProps` 渲染即可；内核的响应式会让你的 Vue 组件自动随之更新。

单元格（`Cell`）暴露的响应式状态：

```ts
cell.value: CellValue
cell.cellValue: CellValue     // 经 type 转换后的值（如 number 列的字符串转数值）
cell.previewing: boolean      // 是否预览态
cell.validating: boolean
cell.loading: boolean
cell.modified: boolean        // 值是否被修改过
cell.errors: string[]
cell.position: CellPosition
cell.colDef: Column

cell.setState(state: 'value', val: CellValue): void
cell.setState(state: 'previewing' | 'validating' | 'loading', val: boolean): void
cell.setState(state: 'errors', val: string[]): void
cell.setComponentProps(props: StaticComponentProps): void
cell.reset(): void
```

## 许可

MIT
