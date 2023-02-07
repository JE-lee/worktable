<template>
  <div>
    <h4>{{ title }}</h4>
    <div style="padding: 10px 0">
      <el-button type="primary" size="mini" @click="add">添加行</el-button>
      <el-button type="primary" size="mini" @click="toggleAll">展开全部</el-button>
      <el-button type="primary" size="mini" @click="validate">校验</el-button>
      <el-button type="primary" size="mini" @click="save">保存</el-button>
    </div>
    <worktable show-summary :summary-method="getSummaries"></worktable>
  </div>
</template>

<script lang="jsx">
import { useWorktable, Worktable } from '@edsheet/element-ui'
import { defineComponent, h, nextTick } from 'vue-demi'
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
  "Wyoming"].map(n => ({ label: n, value: n }))

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
      {
        title: '序号',
        field: 'seq',
        virtual: true,
        width: 140,
        component: 'text',
        componentProps: (row) => {
          const seqs = []
          let parent = row
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
            // console.log('onFieldValueChange', val)
          },
          onFieldInputValueChange(val, row) {
            // console.log('onFieldInputValueChange', val)
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
        field: 'gander',
        title: '性别',
        width: 140,
        type: 'number',
        component: 'select',
        componentProps: {
          placeholder: '请选择',
          optionInChangeEvent: true,
          valueProp: 'code',
          labelProp: 'name',
        },
        componentListeners: {
          change: (...args) => {
            console.log('args', args)
          }
        },
        enum: [
          { label: '男', value: 1, code: 3, name: 'man' },
          { label: '女', value: 2, code: 4, name: 'woman' }
        ],
        default: 3
      },
      {
        title: '监护人',
        field: 'guardian',
        width: 160,
        type: 'object',
        component: UserPicker,
        // componentListeners: {
        //   input(value, row) {
        //     console.log('pick guardian: ', value)
        //     row.guardianAge = value.age
        //   }
        // },
        effects: {
          onFieldValueChange(value, row) {
            row.guardianAge = value.age
          }
        },
        default: {}
      },
      {
        title: '是否已婚',
        field: 'isMarried',
        width: 80,
        component: 'select',
        enum: [
          { label: '是', value: 'married', },
          { label: '否', value: 'unmarried', }
        ],
        effects: {
          // TODO: keep the action parameter types consistent with 'render' component  
          onFieldValueChange(value, row, action) {
            // console.log('action', action)
            if (value === 'married') {
              action.addRow()
            } else {
              action.removeAllRow()
            }
          }
        }
      },
      {
        title: '监护人年龄',
        field: 'guardianAge',
        width: 160,
        virtual: true
      },
      {
        title: '接送方式',
        field: 'pickUpMethod',
        width: 130,
        component: (row) => {
          if (row.guardianAge < 18) {
            return 'input'
          } else {
            return 'select'
          }
        },
        componentProps: (row) => {
          if (row.guardianAge < 18) {
            return {
              disabled: !row.guardianAge,
              placeholder: '请填写你的接送方式'
            }
          } else {
            return {
              disabled: !row.guardianAge,
              placeholder: '请选择',
              options: [
                { label: '步行', value: 1 },
                { label: '车载', value: 2 }
              ]
            }
          }
        }
      },
      {
        field: 'course',
        title: '课程',
        width: 160,
        component: 'async-select',
        componentProps: {
          lazy: true,
          remoteMethod: cache(() => {
            console.log('课程列表请求开始...')
            return new Promise((resolve) => {
              setTimeout(() => {
                console.log('课程列表请求完成...')
                resolve([
                  { label: '语文', value: 1 },
                  { label: '数学', value: 2 },
                  { label: '英语', value: 3 }
                ])
              }, 1000)
            })
          })
        }
      },
      // 原生的远程搜索不好实现
      // {
      //   field: 'cityProps',
      //   virtual: true,
      //   hidden: true,
      //   default: {
      //     loading: false,
      //     options: []
      //   }
      // },
      // 原生的 Select 组件远程搜索不好实现
      {
        field: 'city',
        title: '城市',
        width: 200,
        component: 'async-select',
        componentProps: {
          filterable: true,
          remote: true,
          remoteMethod: (query) => {
            return new Promise((resolve) => {
              setTimeout(() => {
                resolve(states.filter(item => {
                  return item.label.toLowerCase()
                    .indexOf(query.toLowerCase()) > -1;
                }))
              }, 600)
            })
          },
        }
      },
      {
        title: '操作',
        field: 'action',
        width: 200,
        render: (row, { addRow, toggleExpansion, removeSelf }) => {
          // TODO: use jsx
          return h('div', [
            h('el-button', {
              props: {
                type: 'primary',
                size: 'mini'
              },
              on: {
                click: () => {
                  addRow()
                  nextTick(() => toggleExpansion(true))
                }
              }
            }, '添加'),
            h('el-button', {
              props: {
                type: 'danger',
                size: 'mini'
              },
              on: {
                click: () => removeSelf()
              }
            }, '删除')])
        }
      }

    ]
    const { validate, getData, add, toggleRowExpansion } = useWorktable({
      columns,
      initialData: [{ name: '李思', age: 32 }],
      layout: {
        pagination: true,
        feedback: 'popover'
      }
    })

    const save = () => {
      console.log('data: ', getData())
    }

    const getSummaries = () => {
      const sums = ['合计']
      const ageIndex = columns.findIndex(col => col.field === 'age')
      const data = getData()
      sums[ageIndex] = data.reduce((sum, cur) => {
        return isNaN(+cur.age) ? sum : sum + (+cur.age)
      }, 0)
      return sums
    }

    const toggleAll = () => {
      toggleRowExpansion(row => {
        return row.children.length > 0
      }, true)
    }
    return {
      title: '基本用法',
      validate,
      save,
      add: () => add(),
      getSummaries,
      toggleAll
    }
  }

})
</script>
