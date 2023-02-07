<template>
  <div>
    <h4>{{ title }}</h4>
    <div style="padding: 10px 0">
      <el-button type="primary" size="mini" @click="validate">校验</el-button>
      <el-button type="danger" size="mini" @click="removeOne">删除一条</el-button>
    </div>
    <worktable></worktable>
  </div>
</template>

<script >
import { useWorktable, Worktable } from '@edsheet/element-ui'
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
    const { validate, remove } = useWorktable({
      columns, initialData: [{
        name: '李斯',
        age: 32,
        id: 'i1',
        children: [{
          id: 'i2',
          name: '李子航',
          age: 6,
          children: [{ id: 'i3', name: '李佳', age: 1 }]
        }]
      }]
    })

    const ids = ['i1', 'i2', 'i3']
    const removeOne = () => {
      const id = ids.pop()
      remove(row => {
        console.log('id', id, row)
        return row.id === id
      })
    }
    return {
      title: '树形结构',
      validate,
      removeOne
    }
  }

})
</script>
