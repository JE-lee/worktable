<template>
  <div>
    <h4>{{ title }}</h4>
    <div style="padding: 10px 0">
      <el-button type="primary" size="mini" @click="add">添加行</el-button>
      <el-button type="primary" size="mini" @click="toggleAll">展开全部</el-button>
      <el-button type="primary" size="mini" @click="validate">校验</el-button>
      <el-button type="primary" size="mini" @click="save">保存</el-button>
      <el-button type="danger" size="mini" @click="removeSelected">删除选中</el-button>
    </div>
    <worktable show-summary :summary-method="getSummaries" @selection-change="onSelectionChange"></worktable>
  </div>
</template>

<script lang="jsx">
import { useWorktable, Worktable } from '@edsheet/element-ui'
import { defineComponent, h, nextTick, ref } from 'vue-demi'
import UserPicker from './UserPicker'

const states = ["Alabama", "Alaska", "Arizona",
  "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "Florida",
  "Georgia", "Hawaii", "Idaho", "Illinois",
  "Indiana", "Iowa", "Kansas", "Kentucky",
  "Louisiana", "Maine", "Maryland",
  "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana",
  "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York",
  "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania",
  "Rhode Island", "South Carolina",
  "South Dakota", "Tennessee", "Texas",
  "Utah", "Vermont", "Virginia",
  "Washington", "West Virginia", "Wisconsin",
  "Wyoming"].map((n, index) => ({ label: n, value: n }))


function cache(fn) {
  let result = null
  return () => {
    if (result) return result
    const waiting = fn().then((res) => {
      result = waiting
      return res
    })
    return waiting
  }
}

export default defineComponent({
  name: 'BasicWorktable',
  components: { Worktable, UserPicker },
  setup() {
    const columns = [
      { type: 'selection', width: 80 },
      {
        title: '序号',
        field: 'seq',
        virtual: true,
        width: 140,
        render(row, action) {
          const seqs = []
          let parent = row
          while (parent != null) {
            seqs.unshift(parent.index + 1)
            parent = parent.parent
          }
          return h('span', seqs.join('-'))
        }
      },
      {
        title: '名称',
        field: 'name',
        type: 'string',
        component: 'input',
        rule: {
          type: 'string',
          required: true,
          message: '缺少名称',
        },
        effects: {
          onFieldValueChange(val, row, rowAction) {
            console.log('onFieldValueChange:age', val)
          },
          onFieldInputValueChange(val, row) {
            console.log('onFieldInputValueChange:age', val)
          }
        }
      },
      {
        title: '年龄',
        field: 'age',
        width: 160,
        type: 'number',
        disabled: row => row.data.name.length > 2,
        component: 'input',
        componentProps: {
          type: 'number',
        },
        // rule: {
        //   required: true,
        //   message: '年龄必填且不能小于7',
        //   validator(value) {
        //     return value >= 7
        //   }
        // },
        default: ''
      },
      {
        field: 'base',
        title: '是否城市户口',
        width: 200,
        type: 'string',
        component: 'select',
        componentProps: {
          clearable: true,
          // optionInValue: true,
          // multiple: true
        },
        enum: [
          { label: '是', value: 'y' },
          { label: '否', value: 'n' }
        ],
        effects: {
          onFieldValueChange(val, row) {
            if (val === 'n') {
              row.setComponentProps('city', {
                options: [
                  { label: 'heyuan', value: 'heyuan' }
                ]
              })
            }
          }
        }

      },
      {
        field: 'city',
        title: '城市',
        width: 200,
        type: 'array',
        component: 'async-select',
        componentProps: row => {
          return {
            search: true,
            clearable: row.data.base === 'y',
            // optionInValue: true,
            multiple: true,
            reserveKeyword: true,
            // disabled: row.data.base !== 'y',
            remoteMethod: (query) => {

              let timeout = 600
              if (!query) {
                timeout = 2000
              }
              return new Promise((resolve) => {
                setTimeout(() => {
                  const cities = states.filter(item => {
                    return item.label.toLowerCase()
                      .indexOf(query.toLowerCase()) > -1;
                  })
                  console.log('resolve key', query, cities.length)
                  resolve(cities)
                }, timeout)
              })
            },
          }
        },
      },
      {
        title: '操作',
        field: 'action',
        vitrual: true,
        width: 200,
        renderHeader({ field, index, add }) {
          return h('i', {
            staticClass: 'el-icon-circle-plus', on: {
              click() {
                add()
              }
            }
          })
        },
        render: (row) => {
          return h('div', [
            h('el-button', {
              props: {
                type: 'primary',
                size: 'mini'
              },
              on: {
                click: () => {
                  row.addRow()
                  nextTick(() => row.toggleExpansion(true))
                }
              }
            }, '添加'),
            h('el-button', {
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

    ]
    const wt = useWorktable({
      columns,
      layout: {
        pagination: true,
      },
    })

    const save = () => {
      console.log('data: ', wt.getData())
    }

    const getSummaries = ({ columns, data }) => {
      const sums = ['合计']
      const ageIndex = columns.findIndex(col => col.property === 'age')
      sums[ageIndex] = data.reduce((sum, cur) => {
        return isNaN(+cur.age) ? sum : sum + (+cur.age)
      }, 0)
      return sums
    }

    const toggleAll = () => {
      wt.toggleRowExpansion(row => {
        return row.children.length > 0
      }, true)
    }

    function onSelectionChange(...args) {
      console.log('selected:', args)
    }

    return {
      title: '基本用法',
      validate: wt.validate,
      save,
      add: () => wt.add(),
      getSummaries,
      toggleAll,
      onSelectionChange,
      removeSelected: () => wt.removeSelectedRows()
    }
  }

})
</script>
