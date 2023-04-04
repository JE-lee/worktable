# 动态组件

`Column.component` 同样接受一个函数。可以将这个函数看做成一个`effect`，当里面的依赖项有变化的时候，该函数重新执行，并且返回一个动态的 Component。

<code-previewer demoPath="base/DynamicComponent" />
