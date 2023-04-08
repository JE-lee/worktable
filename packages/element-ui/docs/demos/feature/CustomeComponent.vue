<template>
  <Worktable border></Worktable>
</template>

<script>
import { defineComponent } from 'vue-demi'
import { Worktable, useWorktable } from '@edsheet/element-ui'
import { Rate as ElRate } from 'element-ui'
export default defineComponent({
  components: { Worktable },
  setup() {
    useWorktable({
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
  },
})
</script>
