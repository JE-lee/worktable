<template>
  <div>
    <div>大数据表格</div>
    <div>
      <el-button type="primary" @click="doSave">保存</el-button>
      <el-button type="primary" @click="doValidate">校验</el-button>
      <el-button type="primary" @click="doAdd">新增</el-button>
    </div>
    <BigWorktable
      style="height: 400px"
      max-height="400"
      :row-height="48"
      :rowBuffer="10"
    ></BigWorktable>
  </div>
</template>

<script>
import { defineComponent, h } from 'vue-demi'
import { BigWorktable, useBigWorktable } from '@edsheet/element-ui'
export default defineComponent({
  components: {
    BigWorktable,
  },
  setup() {
    const columns = [
      {
        field: 'seq',
        title: '序号',
        virtual: true,
        render: (row) => row.index + 1,
        width: 50,
        fixed: 'left',
        resizable: true,
      },
      {
        field: 'code',
        title: '编码',
        asterisk: true,
        component: 'Input',
        componentProps: {
          placeholder: '请输入',
          clearable: true,
        },
        rule: {
          required: true,
          message: '缺少编码',
        },
      },
      {
        field: 'name',
        title: '名称',
        component: 'Input',
        rule: {
          validator: (val, row) => {
            if (row.data.gander == 'man' && !val) {
              throw '男生必须有名字'
            }
          },
        },
      },
      {
        field: 'gander',
        title: '性别',
        component: 'Select',
        enum: [
          { label: 'man', value: 'man' },
          { label: 'woman', value: 'woman' },
        ],
      },
      {
        field: 'name1',
        title: '常常长长常常长的标题',
        width: 140,
        component: 'Input',
      },
      {
        field: 'name2',
        title: '名称2',
        component: 'Input',
      },
      {
        field: 'name3',
        title: '名称3',
        component: 'Input',
      },
      {
        field: 'name4',
        title: '名称4',
        component: 'Input',
      },

      {
        field: 'name5',
        title: '名称5',
        component: 'Input',
      },

      {
        field: 'name6',
        title: '名称6',
        component: 'Input',
      },
      {
        field: 'name7',
        title: '名称7',
        component: 'Input',
      },

      {
        field: 'name8',
        title: '名称8',
        component: 'Input',
      },

      {
        field: 'name9',
        title: '名称9',
        component: 'Input',
      },
      {
        field: 'name10',
        title: '名称10',
        component: 'Input',
      },
      {
        field: 'name11',
        title: '名称11',
        component: 'Input',
      },
      {
        field: 'name12',
        title: '名称12',
        component: 'Input',
      },
      {
        field: 'name13',
        title: '名称13',
        component: 'Input',
      },
      {
        field: 'name14',
        title: '名称14',
        component: 'Input',
      },

      {
        field: 'name15',
        title: '名称15',
        component: 'Input',
      },

      {
        field: 'name16',
        title: '名称16',
        component: 'Input',
      },
      {
        field: 'name17',
        title: '名称17',
        component: 'Input',
      },

      {
        field: 'name18',
        title: '名称18',
        component: 'Input',
      },

      {
        field: 'name19',
        title: '名称19',
        component: 'Input',
      },
      {
        field: 'name20',
        title: '名称20',
        component: 'Input',
      },
      {
        field: 'action',
        virtual: true,
        fixed: 'right',
        width: 80,
        renderHeader() {
          return h(
            'div',
            {
              style: {
                padding: '4px 0',
                display: 'flex',
                justifyContent: 'center',
              },
            },
            [
              h('el-button', {
                props: {
                  size: 'mini',
                  circle: true,
                  type: 'primary',
                  icon: 'el-icon-plus',
                },
                on: {
                  click: () => {
                    console.log('render header')
                  },
                },
              }),
            ]
          )
        },
      },
    ]
    const rows = new Array(96).fill('').map(() => ({ code: '11', name: '大数据表格' }))
    const wt = useBigWorktable({
      columns,
      initialData: rows,
      layout: {
        size: 'mini',
      },
    })
    window.wt = wt

    function doSave() {
      const data = wt.getData()
      console.log('data', data)
    }

    function doValidate() {
      wt.validate()
    }

    function doAdd() {
      wt.add()
    }

    return {
      doSave,
      doValidate,
      doAdd,
    }
  },
})
</script>
