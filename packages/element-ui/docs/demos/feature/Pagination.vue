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
import { defineComponent, h, nextTick } from 'vue-demi'
import { useWorktable, Worktable } from '@edsheet/element-ui'

export default defineComponent({
  components: { Worktable },
  setup() {
    const columns = [
      {
        title: '序号',
        field: 'seq',
        virtual: true,
        width: 80,
        render(row) {
          const seqs = []
          let parent = row
          while (parent != null) {
            seqs.unshift(parent.index + 1)
            parent = parent.parent
          }
          return seqs.join('-')
        },
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
      {
        title: '操作',
        field: 'action',
        virtual: true,
        width: 120,
        renderHeader({ worktable }) {
          return h('el-button', {
            props: {
              type: 'primary',
              size: 'mini',
              circle: true,
              icon: 'el-icon-plus',
            },
            on: { click: worktable.add },
          })
        },
        render: (row) => {
          return h('div', [
            h(
              'el-button',
              {
                props: { type: 'text', size: 'mini' },
                on: {
                  click: () => {
                    row.addRow()
                    nextTick(() => row.toggleExpansion(true))
                  },
                },
              },
              '添加组员'
            ),
            h(
              'el-button',
              {
                style: { color: 'red' },
                props: { type: 'text', size: 'mini' },
                on: { click: () => row.removeSelf() },
              },
              '删除'
            ),
          ])
        },
      },
    ]
    const worktable = useWorktable({
      initialData: [
        { name: '琪琪', gender: 'girl' },
        { name: '琪琪', gender: 'girl' },
        { name: '琪琪', gender: 'girl' },
        { name: '琪琪', gender: 'girl' },
        { name: '琪琪', gender: 'girl' },
        { name: '琪琪', gender: 'girl' },
        { name: '琪琪', gender: 'girl' },
        { name: '琪琪', gender: 'girl' },
        { name: '琪琪', gender: 'girl' },
        { name: '琪琪', gender: 'girl' },
        { name: '琪琪', gender: 'girl' },
        { name: '琪琪', gender: 'girl' },
      ],
      columns,
      layout: { pagination: true },
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
