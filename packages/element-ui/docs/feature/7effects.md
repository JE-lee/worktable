# Effects

在很多时间节点（比如当字段初始化，值改变的时候）中，我们可以对表格中的其他的字段做额外的动作。

## FieldEffects

|属性|类型|描述|
|----|----|----|
|onFieldInputValueChange|(val: CellValue, row: RowProxy) => void|当用户输入或者选择组件值的时候触发|
|onFieldValueChange|(val: CellValue, row: RowProxy) => void|当用户输入或者选择组件值的时候或者代码赋值的时候触发|
|onFieldValueValidateStart|(val: CellValue, row: RowProxy) => void|当开始校验字段的时候触发|
|onFieldValueValidateSuccess|(val: CellValue, row: RowProxy) => void|当字段校验成功的时候触发|
|onFieldValueValidateFail|(val: CellValue, row: RowProxy, errors: string[]) => void|当字段校验失败的时候触发|
|onFieldValueValidateFinish|(val: CellValue, row: RowProxy) => void|当字段校验完成的时候触发|
|onFieldReact|((row: RowProxy) => void) \| [(row: RowProxy) => any, row: RowProxy) => void]|被动模式副作用，当里面访问的依赖项变化的时候，自动重新执行|

## TableEffects

|属性|类型|描述|
|----|----|----|
|onFieldInputValueChange|(val: CellValue, row: RowProxy) => void|当用户输入或者选择组件值的时候触发|
|onFieldValueChange|(val: CellValue, row: RowProxy) => void|当用户输入或者选择组件值的时候或者代码赋值的时候触发|


