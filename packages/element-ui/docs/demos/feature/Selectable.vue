<template>
  <div>
    <div>
      <el-button type="primary" size="mini" @click="doValidate">校验</el-button>
      <el-button type="primary" size="mini" @click="doSubmit">提交</el-button>
      <el-button type="primary" size="mini" @click="doAdd">添加</el-button>
      <el-button type="danger" size="mini" @click="doRemove" :disabled="selections.length === 0"
        >删除选中</el-button
      >
    </div>
    <worktable class="mt-10" border @selection-change="onSelectionChange" />
  </div>
</template>

<script>
import { defineComponent, shallowRef } from 'vue-demi'
import { useWorktable, Worktable } from '@edsheet/element-ui'

export default defineComponent({
  components: { Worktable },
  setup() {
    const selections = shallowRef([])
    const columns = [
      { type: 'selection', width: 60 },
      { type: 'index', width: 80, title: '序号' },
      {
        title: '自定义序号列',
        field: 'seq',
        virtual: true,
        width: 120,
        value: (row) => `序号:${row.index + 1}`,
      },
      {
        title: '名称',
        field: 'name',
        type: 'string',
        component: 'Input',
        required: true,
        requiredMessage: '缺少名称',
      },
      {
        title: '年龄',
        field: 'age',
        type: 'number',
        component: 'Input',
        componentProps: {
          type: 'number',
        },
        default: '',
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
    ]
    const wt = useWorktable({
      initialData: [{ name: '琪琪', gender: 'girl' }],
      columns,
    })

    function doValidate() {
      wt.validate()
        .then(() => {
          console.log('validate successed')
        })
        .catch((err) => {
          console.error(err)
        })
    }

    async function doSubmit() {
      await wt.validate()
      const data = wt.getData()
      console.log('data', data)
    }

    function onSelectionChange(selected) {
      selections.value = selected
    }

    function doRemove() {
      wt.remove((row) => selections.value.some((r) => r.rid === row.rid))
      selections.value = []
    }

    function doAdd() {
      wt.add()
    }

    return {
      doValidate,
      doSubmit,
      selections,
      onSelectionChange,
      doRemove,
      doAdd,
    }
  },
})
</script>
