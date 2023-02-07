<template>
  <div>
    <h4>{{ title }}</h4>
    <div style="padding: 10px 0">
      <el-button type="primary" size="mini" @click="validate">校验</el-button>
    </div>
    <worktable></worktable>
  </div>
</template>

<script lang="jsx">
import { useWorktable, Worktable } from '@edsheet/element-ui'
import { defineComponent, h } from 'vue-demi'
import UserPicker from './UserPicker'
export default defineComponent({
  name: 'BasicWorktable',
  components: { Worktable, UserPicker },
  setup() {
    const columns = [
      {
        title: '序号',
        field: 'seq',
        virtual: true,
        width: 140,
        component: 'text',
        componentProps: (row) => {
          const seqs = []
          let parent = row
          console.log('row', row)
          while (parent != null) {
            seqs.unshift(parent.index + 1)
            parent = parent.parent
          }
          return {
            text: seqs.join('-'),
          }
        },
      },
      {
        title: '名称',
        field: 'name',
        type: 'string',
        width: 160,
        component: 'input',
        rule: {
          type: 'string',
          required: true,
          message: '缺少名称',
        },
        effects: {
          onFieldValueChange(val, row) {
            console.log('onFieldValueChange', val)
          },
          onFieldInputValueChange(val, row) {
            console.log('onFieldInputValueChange', val)
          }
        }
      },
      {
        title: '年龄',
        field: 'age',
        width: 160,
        type: 'number',
        component: 'input',
        componentProps: {
          type: 'number'
        },
        rule: {
          required: true,
          message: '年龄必填且不能小于7',
          validator(value) {
            return value >= 7
          }
        }
      },
      {
        title: '监护人',
        field: 'guardian',
        width: 160,
        type: 'object',
        component: UserPicker,
        componentListeners: {
          input(value, row) {
            console.log('pick guardian: ', value)
            row.guardianAge = value.age
          }
        },
        // effects: {
        //   onFieldValueChange(value, row){
        //     row.guardianAge = value.age
        //   }
        // },
        default: {}
      },
      {
        title: '监护人年龄',
        field: 'guardianAge',
        width: 160,
      },
      
      {
        title: '操作',
        field: 'action',
        width: 200,
        component: 'render',
        componentProps: {
          render: (row) => {
            return h('div', [
              h('el-button', {
                props: {
                  type: 'primary',
                  size: 'mini'
                },
                on: {
                  click: () => row.addRow()
                }
              }, '添加'),
              row.children.length > 0 && h('el-button', {
                props: {
                  type: 'danger',
                  size: 'mini'
                },
                on: {
                  click: () => row.removeSelf()
                }
              }, '删除')])
          }
        }
      }

    ]
    const { validate } = useWorktable({
      columns, initialData: [{ name: '李思', age: 32 }]
    })
    return {
      title: '基本用法',
      validate
    }
  }

})
</script>
