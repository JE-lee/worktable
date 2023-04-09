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

export default defineComponent({
  components: { Worktable },
  setup() {
    const columns = [
      {
        title: '性别',
        field: 'gender',
        component: 'select',
        enum: [
          { label: '男', value: 'man' },
          { label: '女', value: 'woman' },
        ],
      },
      {
        title: '年龄',
        field: 'age',
        component: 'input',
        type: 'number',
        reuqired: true,
        requiredMessage: '该字段必填',
        componentProps: { type: 'number' },
        rule: {
          validator(val, row) {
            const gender = row.data.gender
            if (gender === 'man' && val > 20) {
              throw '男性要求小于20岁'
            } else if (gender === 'woman' && val < 20) {
              throw '女性要求大于20岁'
            }
          },
        },
      },
    ]
    const worktable = useWorktable({
      initialData: [{ name: '琪琪', gender: 'woman', age: 18 }],
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
