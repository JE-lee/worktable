# 自动校验
得益于 `mobx` 的响应式，`edsheet` 会在创建 Table 的时候自动收集 `rule` 校验的依赖字段。当对应字段
的 `value` 值发生改变（通过表单组件 Input, Select 等输入或者手动赋值）时，就会重新执行校验。



```javascript
const columns = [
  {
    title: '性别',
    field: 'gender',
    component: 'select',
    enum: [
      { label: '男', value: 'man' },
      { label: '女', value: 'woman' },
    ]
  },
  {
    title: '年龄',
    field: 'age',
    component: 'input',
    componentProps: { type: 'number' },
    rule: {
      validator(val, row) {
        const gender = row.data.gender
        if (gender === 'man' && val < 22) {
          throw '男性要求大于22岁'
        } else if (gender === 'woman' && val < 20) {
          throw '女性要求大于20岁'
        }
      }
    }
  }
]
```
如上，当用户每次选择了不同的性别的时候，对应行上的 `age` 列都会自动执行 validator 进行校验。
