# 动态组件

`Column.component` 同样接受一个函数。可以将这个函数看做成一个`effect`，当里面的依赖项有变化的时候，该函数重新执行，并且返一个新的的 Component。

在下面的例子中，`喜欢的玩具` 列渲染的组件根据 `性别` 列动态变化。

<code-previewer demoPath="feature/DynamicComponent" :collapsed="false"/>
