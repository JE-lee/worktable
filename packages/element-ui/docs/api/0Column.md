# Column

|属性|描述|必须|默认值|类型|
|----|----|----|----|----|
|title|表格 header 名称|否|无||
|field|单元格字段|是|无||
|type|单元格值类型|否|'string'||
|default|单元格默认值|否|无||
|width|单元格宽度|否|无||
|component|单元格渲染的表单组件|否|无||
|componentProps|单元格组件预设的组件属性|否|无||
|rule|单元格值校验规则|否|无||
|render|单元格渲染函数|否|无|(row: RenderRowProxy, wt: WorktableReturn) => VNode|
|renderHeader|表头列渲染函数|否|无|({ field, colIndex, worktable }) => VNode|
