<template>
  <worktable border />
</template>

<script>
import { useWorktable, Worktable } from '@edsheet/element-ui'
import { defineComponent, h } from 'vue-demi'

export default defineComponent({
  components: { Worktable },
  setup() {
    const columns = [
      { type: 'selection', width: 80 },
      {
        title: '序号',
        field: 'seq',
        virtual: true,
        width: 140,
        render(row) {
          const seqs = []
          let parent = row
          while (parent != null) {
            seqs.unshift(parent.index + 1)
            parent = parent.parent
          }
          return h('span', seqs.join('-'))
        },
      },
      {
        title: '名称',
        field: 'name',
        type: 'string',
        component: 'input',
      },
      {
        title: '年龄',
        field: 'age',
        width: 160,
        type: 'number',
        component: 'input',
        componentProps: {
          type: 'number',
        },
        default: '',
      },
      {
        title: '操作',
        field: 'action',
        vitrual: true,
        width: 200,
        renderHeader({ add }) {
          return h(
            'el-button',
            {
              props: {
                type: 'primary',
                size: 'mini',
              },
              on: {
                click() {
                  add()
                },
              },
            },
            '添加'
          )
        },
        render: (row) => {
          return h('div', [
            h(
              'el-button',
              {
                props: {
                  type: 'primary',
                  size: 'mini',
                },
                on: {
                  click: () => {
                    row.addRow()
                  },
                },
              },
              '添加'
            ),
            h(
              'el-button',
              {
                props: {
                  type: 'danger',
                  size: 'mini',
                },
                on: {
                  click: () => row.removeSelf(),
                },
              },
              '删除'
            ),
          ])
        },
      },
    ]
    useWorktable({
      columns,
    })

    return {}
  },
})
</script>
