# useWorktable

```typescript
interface useWorktable {
  (opt: WorktableOpt): WorktableReturn
}
```

## WorktableOpt
|属性|类型|描述|默认值|必须|
|----|----|----|----|----|
|key|string|Table 名称（和 \<Worktable\/\> 组件的 `name` 属性对应）|"inject-edit-table-__default"|否|
|columns|Column[]|column 配置|[]|否|
|initialData|Record<string, any>[]|初始数据|[]|否|
|layout|TableLayout|Table 样式配置|{ pagination: false, size: 'mini', feedback: 'terse' }|否|


## WorktableReturn

### setColumns

重新设置表格的列。

```typescript
interface setColumns {
  (cols: Column[]): void
}
```

### getData

不执行校验，直接返回 Table 当前的数据。

```typescript
interface getData {
  (): Promise<Record<string, any>[]>
}
```

### setData

设置 Table 的数据。⚠️ 这会清空原来的所有数据。

```typescript
interface setData {
  (rows: RowRaw | RowRaw[]): void
}
```

### addRow

向 Table 中追加一条数据。

```typescript
interface addRow {
  (raw: RowRaw = {}): RowProxy
}
```

### addRows

向 Table 中追加多条数据。

```typescript
interface addRow {
  (raw: RowRaw[]): RowProxy[]
}
```

### add

向 Table 中追加一条或多条数据。

```typescript
interface add {
  // 追加一条默认数据
  (raw: void): RowProxy
  (raw: RowRaw): RowProxy
  (raw: RowRaw[]): RowProxy[]
}
```

### remove

删除所有符合条件的行。

```typescript
interface remove {
  (rid: number): void
  (filter: ((row: RowProxy) => boolean)): void
}
```

### removeAll

删除所有行。

```typescript
interface removeAll {
  () => void
}
```

### forEach

遍历所有行，包括树形数据的 children 行，类似于 Array.prototype.forEach

```typescript
interface forEach {
  (processor: ((row: RowProxy) => void)): void
}
```

### walk

同 [forEach](#foreach)

```typescript
interface walk {
  (processor: ((row: RowProxy) => void)): void
}
```

### find

返回第一个符合条件的行，类似于 Array.prototype.find

```typescript
interface find {
  (filter: ((row: RowProxy) => boolean)): RowProxy | null
}
```

### findAll

返回所有符合条件行。
如果不指定 `filter`, 则返回所有行。


```typescript
interface findAll {
  (filter?: ((row: RowProxy) => boolean)): RowProxy[]
}
```

### filter

同 [findAll](#findall)

```typescript
interface filter {
  (filter?: ((row: RowProxy) => boolean)): RowProxy[]
}
```

### setValuesInEach

对于符合条件的 `Row`, 设置指定的值。
如何不指定 `filter` , 将对所有行设置值。

```typescript
interface setValuesInEach {
  (row: (row: RowProxy) => Record<string, any>, filter?: Filter): void
  (raw: Record<string, any>, filter?: Filter): void
  (raw: any, filter?: Filter): void
}
```

### addEffect

添加全局的事件响应。

```typescript
enum TABLE_EVENT_NAME {
  ON_FIELD_VALUE_CHANGE = 'onFieldValueChange',
  ON_FIELD_INPUT_VALUE_CHANGE = 'onFieldInputValueChange',
  ON_VALIDATE_START = 'onValidateStart',
  ON_VALIDATE_SUCCESS = 'onValidateSuccess',
  ON_VALIDATE_FAIL = 'onValidateFail',
  ON_VALIDATE_FINISH = 'onValidateFinish',
}

type EffectListener = (val: any, row: RowProxy) => void

interface addEffect {
  (eventName: TABLE_EVENT_NAME, listener: EffectListener): void
}
```

### addFieldEffect

添加 `Cell` 的事件响应。

```typescript
enum FIELD_EVENT_NAME {
  ON_FIELD_INIT = 'onFieldInit',
  ON_FIELD_VALUE_CHANGE = 'onFieldValueChange',
  ON_FIELD_INPUT_VALUE_CHANGE = 'onFieldInputValueChange',
  ON_FIELD_VALUE_VALIDATE_START = 'onFieldValueValidateStart',
  ON_FIELD_VALUE_VALIDATE_SUCCESS = 'onFieldValueValidateSuccess',
  ON_FIELD_VALUE_VALIDATE_FAIL = 'onFieldValueValidateFail',
  ON_FIELD_VALUE_VALIDATE_FINISH = 'onFieldValueValidateFinish',
}

type EffectListener = (val: any, row: RowProxy) => void

interface addFieldEffect {
  (feild: string, eventName: FIELD_EVENT_NAME, listener: EffectListener): void
}
```

### pauseEffects

挂起所有的 effects。
你可能在一些特殊情况中需要用到这个。

```typescript
interface pauseEffects {
  (): void
}
```

### resumeEffects

恢复所有挂起的 effects。
你可能在一些特殊情况中需要用到这个。

```typescript
interface resumeEffects {
  (): void
}
```

### validate

```typescript
interface validate {
  (): Promise<void>
}
```

### submit

执行校验，返回 Table 的所有数据。

```typescript
interface submit {
  (): Promise<Record<string, any>[]>
}
```

### gotoPage

跳转到指定页面（从 1 开始算起）

```typescript
interface gotoPage {
  (index: number): void
}
```


### gotoFirstPage

跳转到第一页

```typescript
interface gotoFirstPage {
  (): void
}
```

### gotoLastPage

跳转到最后一页

```typescript
interface gotoLastPage {
  (): void
}
```



