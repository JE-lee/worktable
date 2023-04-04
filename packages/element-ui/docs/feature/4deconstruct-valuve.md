# 值解构

一种比较常见的情况是，我们需要使用 `Select` 组件选择某个用户或者某个商品，但是接口要求不仅要保存 code, 还需要保存对应的名称。在这种情况下面，我们可以让 `Select` 组件的`value`是一个对象，包含`Option`的所有内容
```javascript
import { defineComponent } from 'vue-demi'
import { useWorktable, Worktable } from '@edsheet/element-ui'

export default defineComponent({
  components: { Worktable },
  setup() {
    const columns = [
      {
        title: '用户',
        field: 'user',
        type: 'object',
        width: 180,
        component: 'Select',
        componentProps: {
          optionInValue: true, // 将 option 作为 value
          valueProp: 'code',
          labelProp: 'name',
        },
        enum: [
          { code: 'zhangsan', name: '章三', id: 1 },
          { code: 'lisi', name: '莉丝', id: 2 },
        ],
      },
    ]
    useWorktable({ columns })
    return {}
  },
})
```

此时我们的值是这样的
```json
[
  { "user": { "name": "章三", "code": "zhangsan", "id": 1 } }
]
```
但是接口要求的可能往往是一个展开的值，如`[{ userName: '', userCode: '' }]`，
此时我们可以对`field`字段使用`解构语法`来声明我们真实的字段名。
```javascript
const columns = [
  {
    title: '用户',
    field: '{ code: userCode, name: userName }',
    type: 'object',
  },
]
```
完整的例子参考如下：
<code-previewer demoPath="base/DeconstructValue" />

**此外，我们还可以解构 type 为 array 的值**
```javascript
const columns = [
  {
    title: '用户',
    field: '[userCode, userName]',
    type: 'array',
  },
]
```
