<template>
  <div>
    <div>
      <el-button type="primary" size="mini" @click="doSubmit">提交</el-button>
    </div>
    <worktable class="mt-10" border />
  </div>
</template>

<script>
import { defineComponent } from 'vue-demi'
import { useWorktable, Worktable } from '@edsheet/element-ui'

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
        title: '用户',
        field: '{code:userCode,name:userName}',
        type: 'string',
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
    const worktable = useWorktable({ columns })
    worktable.addRow()
    function doSubmit() {
      console.log(worktable.getData())
    }
    return { doSubmit }
  },
})
</script>
