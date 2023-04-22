<template>
  <div>
    <div>
      <el-button type="primary" size="mini" @click="toggleLoading">{{ text }}</el-button>
    </div>
    <worktable class="mt-10" border />
  </div>
</template>

<script>
import { defineComponent, h, computed, ref } from 'vue-demi'
import { useWorktable, Worktable } from '@edsheet/element-ui'

export default defineComponent({
  components: { Worktable },
  setup() {
    const loading = ref(false)
    const text = computed(() => {
      if (loading.value) {
        return '关闭 loading'
      } else {
        return '开启 loading'
      }
    })

    const columns = [
      { field: 'Input', title: 'Input', component: 'Input' },
      { field: 'Select', title: 'Select', component: 'Select' },
      { field: 'Cascader', title: 'Cascader', component: 'Cascader' },
      { field: 'DatePicker', title: 'DatePicker', component: 'DatePicker' },
      { field: 'Raw', title: 'Raw' },
      {
        field: 'Render',
        title: 'Render',
        render(row) {
          return h('button', [row.data.Render])
        },
      },
    ]
    const wt = useWorktable({ columns })

    // 添加一条空数据
    wt.add({ Raw: 'Raw', Render: 'Render' })

    function toggleLoading() {
      loading.value = !loading.value
      const rows = wt.findAll()
      rows.forEach((row) => row.setLoading(loading.value))
    }
    return {
      loading,
      text,
      toggleLoading,
    }
  },
})
</script>
