<template>
  <div>
    <h4>{{ title }}</h4>
    <div style="padding: 10px 0">
      <el-button type="primary" size="mini" @click="validate">校验</el-button>
    </div>
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
        title: '序号',
        field: 'seq',
        virtual: true,
        width: 140,
        component: 'text',
        componentProps: ({ row }) => {
          const seqs = []
          let parent = row
          while (parent != null) {
            seqs.unshift(parent.rIndex + 1)
            parent = parent.parent
          }
          return {
            text: seqs.join('-'),
          }
        },
      },
      {
        title: '名称',
        field: 'name',
        type: 'string',
        component: 'input',
        componentProps: {
          size: 'default'
        },
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
    const { validate } = useWorktable({
      columns,
      initialData: [{
        name: '李斯', age: 32,
        children: [{
          name: '李子航', age: 6,
          children: [{ name: '李佳', age: 1 }]
        }]
      }],
      layout: { size: 'mini' }
    })
    return {
      title: '树形结构',
      validate
    }
  }

})
</script>
