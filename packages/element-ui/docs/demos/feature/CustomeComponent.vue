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
import { Worktable, useWorktable } from '@edsheet/element-ui'
import { Rate as ElRate } from 'element-ui'
export default defineComponent({
  components: { Worktable },
  setup() {
    const worktable = useWorktable({
      columns: [
        { title: '名称', field: 'name', component: 'Input', width: 200 },
        {
          title: '评分',
          width: 200,
          field: 'score',
          type: 'number',
          component: ElRate,
        },
      ],
      initialData: [{ score: 3, name: '琪琪' }],
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
