# 自定义组件
除了内置组件外，还支持自定义组件。
理论上只要满足以下两个条件的都可以用作 `edsheet` 的组件。

1. 具有 `value` Props.
2. 能够 emit input 事件来改变 value。 
 
具备上述两个条件的组件，就能够和 `edsheet` 通信。

<code-previewer demoPath="feature/CustomeComponent" :collapsed="false"/>
