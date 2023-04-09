<template>
  <div>
    <div>
      <el-button type="primary" size="mini" @click="doValidate">校验</el-button>
      <el-button type="primary" size="mini" @click="doSubmit">提交</el-button>
    </div>
    <worktable class="mt-10" border />
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
        // 渲染的组件是动态的，根据性别的不同来渲染不同的组件
        component: (row) => (row.data.gender === 'boy' ? 'Select' : 'Input'),
        // 组件属性也可以是动态的
        componentProps: (row) => {
          return {
            placeholder: row.data.gender === 'boy' ? '请选择一个玩具' : '请输入玩具名称',
          }
        },
        enum: toys,
      },
    ]
    const worktable = useWorktable({
      initialData: [{ name: '琪琪', gender: 'girl' }],
      columns,
    })
    function doValidate() {
      worktable
        .validate()
        .then(() => {
          console.log('validate successed')
        })
        .catch((err) => {
          console.error(err)
        })
    }
    async function doSubmit() {
      await worktable.validate()
      const data = worktable.getData()
      console.log('data', data)
    }

    return {
      doValidate,
      doSubmit,
    }
  },
})
</script>
