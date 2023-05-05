# 内置组件
基于 Element-ui 组件库，提供了一些内置的表单组件：
* Input
* Select
* AsyncSelect
* Cascader
* Render

## Input
### API
参考 [https://element.eleme.io/#/zh-CN/component/input](https://element.eleme.io/#/zh-CN/component/input)

## Select
### API
参考 [https://element.eleme.io/#/zh-CN/component/select](https://element.eleme.io/#/zh-CN/component/select)

### 扩展属性
|属性|类型|描述|默认值|
|----|----|----|----|
|optionInValue|boolean|是否将 option 作为 value（此时 Select 组件的 value 类型是个 Object）|false|
|options|Record<string, any>[]|option 数组|[]|
|labelProp|string|label 字段在 option 中对应的字段|'value'|
|valueProp|string|value 字段在 option 中对应的字段|'label'|

## AsyncSelect

异步搜索下拉框

<code-previewer demoPath="feature/AddressLinkage" />

### API
参考 [Select](#select)

### 扩展属性
|属性|类型|描述|默认值|
|----|----|----|----|
|lazy|boolean|是否只在组件 focus 的时候才加载异步 options|true|
|fresh|boolean|是否在每次 focus 的时候重新加载异步 options|false|
|search|boolean|是否启用搜索模式|false|
|searchImmediate|boolean|搜索模式下是否立即搜索|false|
|remoteMethod|(searchText: string) => Promise<Record<string, any>[]>|异步搜索函数|false|


## Cascader
### API
参考 [https://element.eleme.io/#/zh-CN/component/cascader](https://element.eleme.io/#/zh-CN/component/cascader)
### 扩展属性
|属性|类型|描述|默认值|
|----|----|----|----|
|optionInValue|boolean|是否将 option 作为 value（此时 Cascader 组件的 value 类型是个 Object）|false|
|options|Record<string, any>[]|option 数组|[]|
|labelProp|string|label 字段在 option 中对应的字段|'value'|
|valueProp|string|value 字段在 option 中对应的字段|'label'|


## Render

自定义渲染组件

### 属性
|属性|类型|描述|默认值|
|----|----|----|----|
|render|(row: RowProxy, wt: WorktableReturn)|渲染函数，返回 VNode |true|


