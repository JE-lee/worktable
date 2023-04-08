<template>
  <div>
    <div>
      <el-button type="primary" size="mini">校验</el-button>
      <el-button type="primary" size="mini">提交</el-button>
    </div>
    <worktable border />
  </div>
</template>

<script>
import { defineComponent } from 'vue-demi'
import { useWorktable, Worktable } from '@edsheet/element-ui'
import { toys } from '../const'

export default defineComponent({
  components: { Worktable },
  setup() {
    const columns = [
      {
        title: '序号',
        field: 'seq',
        virtual: true,
        width: 140,
        render(row) {
          return row.index + 1
        },
      },
      {
        title: '名称',
        field: 'name',
        type: 'string',
        component: 'Input',
      },
      {
        title: '性别',
        field: 'gender',
        type: 'string',
        width: 200,
        component: 'Select',
        enum: [
          { label: '男孩', value: 'boy' },
          { label: '女孩', value: 'girl' },
        ],
      },
      {
        title: '喜欢的玩具',
        field: 'toy',
        width: 200,
        // plachoder 是动态的
        component: (row) => (row.data.gender === 'boy' ? 'Select' : 'Input'),
        enum: toys,
      },
    ]
    const worktable = useWorktable({
      initialData: [{ name: '琪琪', gender: 'girl' }],
      columns,
    })
    console.log('worktable', worktable)
    return {}
  },
})
</script>
