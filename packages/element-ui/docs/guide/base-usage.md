# 基本使用

先在项目入口 `main.js` 中导入样式文件
```javascript
import '@edsheet/element-ui/esm/style.css'
```
或者是在你自己的主题文件之后导入
```javascript
import '@edsheet/element-ui/esm/theme/style/index.scss'
```
然后我们需要声明表格的 `columns`，每一个 `column` 描述了对应单元格的字段名称，值类型，渲染的组件，校验规则等。
然后在页面中引入 `Worktable` 组件，接着使用 `useWorktable` 就可以将表格组件和 `columns` 关联起来。此时我们就有了一个基本的可编辑的表格了。


<code-previewer demoPath="base/index" :collapsed="false"/>

