<template>
  <div>
    <h4>{{ title }}</h4>
    <el-button type="primary" size="small" @click="validate">校验</el-button>
    <worktable></worktable>
  </div>
</template>

<script >
import { useWorktable, Worktable } from '@worktable/element-ui'
import { defineComponent } from 'vue-demi'
export default defineComponent({
  name: 'BasicWorktable',
  components: { Worktable },
  setup() {
    const columns = [
      {
        title: '名称',
        field: 'name',
        type: 'string',
        component: 'input',
        // componentProps: ({ row }) => {
        //   return {
        //     disabled: row.age > 20
        //   }
        // }
        rule: {
          required: true,
          message: '缺少名称'
        }
      },
      {
        title: '年龄',
        field: 'age',
        type: 'number',
        component: 'input',
        componentProps: {
          type: 'number'
        },
        rule: {
          required: true
        }
      },
      {
        title: '生日',
        field: 'birthday',
        type: 'number',
        component: 'datepicker',
      },
      {
        title: '电话',
        field: 'phone',
        type: 'string',
        component: 'input',
      },
      
    ]
    const { validate } = useWorktable({ columns, initialData: [{ name: '李斯', age: 32 }] })
    return {
      title: '基本用法',
      validate
    }
  }

})
</script>
