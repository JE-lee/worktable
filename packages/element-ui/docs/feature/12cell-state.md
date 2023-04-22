# Cell 的状态

## disabled

为 `true` 的时候，Cell 里面的组件不可编辑。
可通过 `RowProxy.setComponentProps` 来设置该状态。

## loading

为 `true` 的时候，Cell 里面的组件不可编辑，并且在单元格的末尾显示 `loading` 状态。
可通过 `RowProxy.setLoading` 来设置该状态。

<code-previewer demoPath="feature/CellLoading" />
