# RowProxy

|属性|类型|描述|备注|
|----|----|----|----|----|
|parent|RowProxy|父行||
|children|RowProxy[]|子行||
|index|number||响应式|
|rid|string||{ pagination: false, size: 'mini', feedback: 'terse' }|
|data|RowDataProxy|Row 的数据||
|errors|Record<string, string[]> |Row 中每一个 Cell 的错误信息||
|addRow||添加一行子行||
|addRows||添加多行子行||
|removeRow||删除子行||
|removeSelf||删除自身||
|removeAllRow||删除所有字行||
|setComponentProps||设置该行中 field 单元格的组件属性||
|reset||重置该行或者改行某个字段的值||
|setValues||设置行数据||
|getValues||返回行数据||
|getValue||返回行数据||
|setLoading||设置 Cell 是否处于 loading 状态||

```typescript
type RowProxy =  {
  parent?: RowProxy
  children: RowProxy[]
  index: number
  // 行 id，唯一且不变
  rid: number
  data: RowDataProxy
  // 行的错误信息
  errors: Record<string, string[]> 
  // 添加子行
  addRow: (raw?: RowRaw) => RowProxy
  // 添加多行子行
  addRows: (raws: RowRaw[] = []) => RowProxy[] 
  // 删除子行
  removeRow: (rid: number) => void 
  // 删除子行
  removeRow: (filter: ((row: RowProxy) => boolean)) => void
  // 删除自身
  removeSelf: () => void 
  // 删除所有子行
  removeAllRow: () => void 
  // 设置该行中 field 单元格的组件属性
  setComponentProps: (field: string, extralProps: Record<string, any>) => void
  // 重置该行或者改行某个字段的值 
  reset: (field?: string | string[]) => void 
  // 设置行数据
  setValues: (raw: Record<string, any>) => void 
  // 返回行数据
  getValue: () => RawRaw
  // 设置 Cell 是否处于 loading 状态
  setLoading: (field?: string | string[], loading: boolean) => void
  // 设置 Row 里面所有的 Cell 是否处于 loading 状态
  setLoading: ( loading: boolean) => void 
}

type RowRaw = {
  [field: string]: any
}
type RowDataProxy =  {
  [field: string]: any
}
```
