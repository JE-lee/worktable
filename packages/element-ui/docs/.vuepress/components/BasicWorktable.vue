<template>
  <div>
    <h4>{{ title }}</h4>
    <div style="padding: 10px 0">
      <el-button type="primary" size="mini" @click="add">添加行</el-button>
      <el-button type="primary" size="mini" @click="toggleAll">展开全部</el-button>
      <el-button type="primary" size="mini" @click="validate">校验</el-button>
      <el-button type="primary" size="mini" @click="save">保存</el-button>
    </div>
    <worktable></worktable>
    <el-cascader :options="cascaderOptions" v-model="ca"></el-cascader>
    <SearchSelect></SearchSelect>
  </div>
</template>

<script lang="jsx">
import { useWorktable, Worktable } from '@edsheet/element-ui'
import { defineComponent, h, nextTick, ref } from 'vue-demi'
import UserPicker from './UserPicker'
import SearchSelect from './search-select'

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

const cascaderOptions = [{
  value: 'zhinan',
  label: '指南',
  children: [{
    value: 'shejiyuanze',
    label: '设计原则',
    children: [{
      value: 'yizhi',
      label: '一致'
    }, {
      value: 'fankui',
      label: '反馈'
    }, {
      value: 'xiaolv',
      label: '效率'
    }, {
      value: 'kekong',
      label: '可控'
    }]
  }, {
    value: 'daohang',
    label: '导航',
    children: [{
      value: 'cexiangdaohang',
      label: '侧向导航'
    }, {
      value: 'dingbudaohang',
      label: '顶部导航'
    }]
  }]
}, {
  value: 'zujian',
  label: '组件',
  children: [{
    value: 'basic',
    label: 'Basic',
    children: [{
      value: 'layout',
      label: 'Layout 布局'
    }, {
      value: 'color',
      label: 'Color 色彩'
    }, {
      value: 'typography',
      label: 'Typography 字体'
    }, {
      value: 'icon',
      label: 'Icon 图标'
    }, {
      value: 'button',
      label: 'Button 按钮'
    }]
  }, {
    value: 'form',
    label: 'Form',
    children: [{
      value: 'radio',
      label: 'Radio 单选框'
    }, {
      value: 'checkbox',
      label: 'Checkbox 多选框'
    }, {
      value: 'input',
      label: 'Input 输入框'
    }, {
      value: 'input-number',
      label: 'InputNumber 计数器'
    }, {
      value: 'select',
      label: 'Select 选择器'
    }, {
      value: 'cascader',
      label: 'Cascader 级联选择器'
    }, {
      value: 'switch',
      label: 'Switch 开关'
    }, {
      value: 'slider',
      label: 'Slider 滑块'
    }, {
      value: 'time-picker',
      label: 'TimePicker 时间选择器'
    }, {
      value: 'date-picker',
      label: 'DatePicker 日期选择器'
    }, {
      value: 'datetime-picker',
      label: 'DateTimePicker 日期时间选择器'
    }, {
      value: 'upload',
      label: 'Upload 上传'
    }, {
      value: 'rate',
      label: 'Rate 评分'
    }, {
      value: 'form',
      label: 'Form 表单'
    }]
  }, {
    value: 'data',
    label: 'Data',
    children: [{
      value: 'table',
      label: 'Table 表格'
    }, {
      value: 'tag',
      label: 'Tag 标签'
    }, {
      value: 'progress',
      label: 'Progress 进度条'
    }, {
      value: 'tree',
      label: 'Tree 树形控件'
    }, {
      value: 'pagination',
      label: 'Pagination 分页'
    }, {
      value: 'badge',
      label: 'Badge 标记'
    }]
  }, {
    value: 'notice',
    label: 'Notice',
    children: [{
      value: 'alert',
      label: 'Alert 警告'
    }, {
      value: 'loading',
      label: 'Loading 加载'
    }, {
      value: 'message',
      label: 'Message 消息提示'
    }, {
      value: 'message-box',
      label: 'MessageBox 弹框'
    }, {
      value: 'notification',
      label: 'Notification 通知'
    }]
  }, {
    value: 'navigation',
    label: 'Navigation',
    children: [{
      value: 'menu',
      label: 'NavMenu 导航菜单'
    }, {
      value: 'tabs',
      label: 'Tabs 标签页'
    }, {
      value: 'breadcrumb',
      label: 'Breadcrumb 面包屑'
    }, {
      value: 'dropdown',
      label: 'Dropdown 下拉菜单'
    }, {
      value: 'steps',
      label: 'Steps 步骤条'
    }]
  }, {
    value: 'others',
    label: 'Others',
    children: [{
      value: 'dialog',
      label: 'Dialog 对话框'
    }, {
      value: 'tooltip',
      label: 'Tooltip 文字提示'
    }, {
      value: 'popover',
      label: 'Popover 弹出框'
    }, {
      value: 'card',
      label: 'Card 卡片'
    }, {
      value: 'carousel',
      label: 'Carousel 走马灯'
    }, {
      value: 'collapse',
      label: 'Collapse 折叠面板'
    }]
  }]
}, {
  value: 'ziyuan',
  label: '资源',
  children: [{
    value: 'axure',
    label: 'Axure Components'
  }, {
    value: 'sketch',
    label: 'Sketch Templates'
  }, {
    value: 'jiaohu',
    label: '组件交互文档'
  }]
}]

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
  components: { Worktable, UserPicker, SearchSelect },
  setup() {
    const columns = [
      // {
      //   title: '序号',
      //   field: 'seq',
      //   virtual: true,
      //   width: 140,
      //   render(row, action) {
      //     const seqs = []
      //     let parent = row
      //     while (parent != null) {
      //       seqs.unshift(parent.index + 1)
      //       parent = parent.parent
      //     }
      //     return h('span', seqs.join('-'))
      //   }
      // },
      {
        title: '名称',
        field: 'name',
        type: 'string',
        width: 160,
        component: 'input',
        rule: {
          // type: 'string',
          // required: true,
          // message: '缺少名称',
          validator(val, row) {
            throw 'xxx'
          }
        },
        effects: {
          onFieldValueChange(val, row, rowAction) {
            // console.log('onFieldValueChange', val)
            rowAction.reset('age')
          },
          onFieldInputValueChange(val, row) {
            // console.log('onFieldInputValueChange', val)
          }
        }
      },
      // // 动态 value
      // {
      //   title: '名称2',
      //   field: 'name2',
      //   type: 'string',
      //   width: 160,
      //   value: (row) => `${row.name}/2`
      // },
      // {
      //   title: '年龄',
      //   field: 'age',
      //   width: 160,
      //   type: 'number',
      //   disabled: row => row.name.length > 2,
      //   component: 'input',
      //   componentProps: {
      //     type: 'number',
      //   },
      //   rule: {
      //     required: true,
      //     message: '年龄必填且不能小于7',
      //     validator(value) {
      //       return value >= 7
      //     }
      //   }
      // },
      // {
      //   field: 'gander',
      //   title: '性别',
      //   width: 140,
      //   type: 'number',
      //   component: 'select',
      //   componentProps: {
      //     placeholder: '请选择',
      //     optionInChangeEvent: true,
      //     valueProp: 'code',
      //     labelProp: 'name',
      //   },
      //   componentListeners: {
      //     change: (...args) => {
      //       console.log('args', args)
      //     }
      //   },
      //   enum: [
      //     { label: '男', value: 1, code: 3, name: 'man' },
      //     { label: '女', value: 2, code: 4, name: 'woman' }
      //   ],
      //   default: 3
      // },
      // {
      //   title: '监护人',
      //   field: 'guardian',
      //   width: 160,
      //   type: 'object',
      //   component: UserPicker,
      //   // componentListeners: {
      //   //   input(value, row) {
      //   //     console.log('pick guardian: ', value)
      //   //     row.guardianAge = value.age
      //   //   }
      //   // },
      //   effects: {
      //     onFieldValueChange(value, row) {
      //       row.guardianAge = value.age
      //     }
      //   },
      //   default: {}
      // },
      // {
      //   title: '是否已婚',
      //   field: 'isMarried',
      //   width: 80,
      //   component: 'select',
      //   enum: [
      //     { label: '是', value: 'married', },
      //     { label: '否', value: 'unmarried', }
      //   ],
      //   effects: {
      //     // TODO: keep the action parameter types consistent with 'render' component  
      //     onFieldValueChange(value, row, action) {
      //       // console.log('action', action)
      //       if (value === 'married') {
      //         action.addRow()
      //       } else {
      //         action.removeAllRow()
      //       }
      //     }
      //   }
      // },
      // {
      //   title: '监护人年龄',
      //   field: 'guardianAge',
      //   width: 160,
      //   virtual: true,
      //   effects: {
      //     onFieldValueChange(val, row, action) {
      //       if (val < 18) {
      //         action.setComponentProps('pickUpMethod', {
      //           disabled: !row.guardianAge,
      //           placeholder: '请填写你的接送方式'
      //         })
      //       } else {
      //         action.setComponentProps('pickUpMethod', {
      //           disabled: !row.guardianAge,
      //           placeholder: '请选择',
      //           options: [
      //             { label: '步行', value: 1 },
      //             { label: '车载', value: 2 }
      //           ]
      //         })
      //       }
      //     }
      //   }
      // },
      // {
      //   title: '接送方式',
      //   field: 'pickUpMethod',
      //   width: 130,
      //   component: (row) => {
      //     if (row.guardianAge < 18) {
      //       return 'input'
      //     } else {
      //       return 'select'
      //     }
      //   },
      //   componentProps: (row) => {
      //     if (row.guardianAge < 18) {
      //       return {
      //         disabled: !row.guardianAge,
      //         placeholder: '请填写你的接送方式'
      //       }
      //     } else {
      //       return {
      //         disabled: !row.guardianAge,
      //         placeholder: '请选择',
      //         options: [
      //           { label: '步行', value: 1 },
      //           { label: '车载', value: 2 }
      //         ]
      //       }
      //     }
      //   }
      // },
      // {
      //   field: 'course',
      //   title: '课程',
      //   width: 160,
      //   component: 'async-select',
      //   componentProps: {
      //     options: [{ label: '1', value: '2' }],
      //     lazy: true,
      //     filterable: true,
      //     remote: true,
      //     remoteMethod: cache(() => {
      //       console.log('课程列表请求开始...')
      //       return new Promise((resolve) => {
      //         setTimeout(() => {
      //           console.log('课程列表请求完成...')
      //           resolve([
      //             { label: '语文', value: 1 },
      //             { label: '数学', value: 2 },
      //             { label: '英语', value: 3 }
      //           ])
      //         }, 1000)
      //       })
      //     })
      //   },
      //   default: '2'
      // },
      // {
      //   field: 'project',
      //   title: '项目',
      //   width: 200,
      //   component: 'cascader',
      //   componentProps: {
      //     options: cascaderOptions,
      //     optionInChangeEvent: true,
      //   },
      //   componentListeners: {
      //     change(...rest) {
      //       console.log('change', rest)
      //     }
      //   }
      // },
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
          search: true,
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
        },
      },
      // {
      //   title: '操作',
      //   field: 'action',
      //   width: 200,
      //   renderHeader({ field, index, add }) {
      //     return h('i', {
      //       staticClass: 'el-icon-circle-plus', on: {
      //         click() {
      //           add()
      //         }
      //       }
      //     })
      //   },
      //   render: (row, { addRow, toggleExpansion, removeSelf }) => {
      //     // TODO: use jsx
      //     return h('div', [
      //       h('el-button', {
      //         props: {
      //           type: 'primary',
      //           size: 'mini'
      //         },
      //         on: {
      //           click: () => {
      //             addRow()
      //             nextTick(() => toggleExpansion(true))
      //           }
      //         }
      //       }, '添加'),
      //       h('el-button', {
      //         props: {
      //           type: 'danger',
      //           size: 'mini'
      //         },
      //         on: {
      //           click: () => removeSelf()
      //         }
      //       }, '删除')])
      //   }
      // }

    ]
    const { validate, getData, add, toggleRowExpansion,
      setComponentProps, rows, addFieldEffect,
      setValuesInEach, walk
    } = useWorktable({
      columns,
      // initialData: [{ name: '李思', age: 32 }],
      layout: {
        pagination: true,
      }
    })

    addFieldEffect('name', 'onFieldValueChange', (...rest) => {
      console.log('value change', ...rest)
    })



    add({ city: 'v2'})



    setTimeout(() => {
      walk((row, action) => {
        action.setComponentProps('city', { options: [{ label: 'Vermont', value: 'v2' }] })
      })
    }, 1000);


    window.rows = rows

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
      toggleAll,
      cascaderOptions,
      ca: ref(null)
    }
  }

})
</script>
