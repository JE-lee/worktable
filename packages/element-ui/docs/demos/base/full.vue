<template>
  <div>
    <div>
      <el-button type="primary" size="small" @click="doSave">保存（已打印在控制台）</el-button>
      <el-button type="primary" size="small" @click="doValidate">校验</el-button>
      <el-button size="small" @click="doAdd">添加商品</el-button>
    </div>
    <Worktable style="margin-top: 20px" border></Worktable>
  </div>
</template>

<script>
import { defineComponent, h, nextTick } from 'vue-demi'
import { Worktable, useWorktable } from '@edsheet/element-ui'
import { getProducts, getProvinces, getCities, getAreas } from './api'
import { Button as ElButton, Checkbox as ElCheckbox, DatePicker as ElDatePicker } from 'element-ui'

const PRODUCT_CODE = 'productCode'
const PRODUCT = `{${PRODUCT_CODE}, productName}`
const PRODUCTION_PROVINCE = 'productionProvince'
const PRODUCTION_CITY = 'productionCity'
const PRODUCTION_AREA = 'productionArea'

export default defineComponent({
  name: 'WorktableWrapper',
  components: { Worktable },
  setup() {
    const columns = [
      {
        field: 'seq',
        title: '序号',
        value: (row) => {
          return row.parent ? `${row.parent.index + 1}-${row.index + 1}` : row.index + 1
        },
        width: 80,
      },
      {
        field: PRODUCT,
        type: 'object',
        title: '商品',
        component: 'async-select',
        width: 180,
        componentProps: {
          optionInValue: true,
          labelProp: 'productName',
          valueProp: 'productCode',
          remoteMethod: getProducts,
          clearable: true,
        },
        required: true,
        rule: {
          validator(val) {
            if (!val.productCode) throw '请选择商品'
          },
        },
      },
      {
        field: PRODUCT_CODE,
        title: '商品编码',
        width: 140,
      },
      {
        field: 'isGroup',
        type: 'boolean',
        title: '是否组合商品',
        width: 120,
        component: (row) => (row.parent ? 'render' : ElCheckbox),
        componentProps: {
          render: (row) => {
            if (row.parent) {
              return '-'
            }
          },
        },
        effects: {
          onFieldValueChange: (val, row) => {
            if (!val) {
              row.removeAllRow()
            }
          },
        },
        default: false,
      },
      {
        field: 'count',
        type: 'number',
        title: '数量',
        width: 140,
        component: 'Input',
        componentProps: {
          type: 'number',
          placeholder: '请输入',
        },
        required: true,
        requiredMessage: '缺少数量',
        rule: {
          validator(val, row) {
            if (val <= 0) throw '要求是正数'
            if (row.data.isGroup && val > 1) throw '组合商品数量不能大于1'
          },
        },
        default: 10,
      },
      {
        field: PRODUCTION_PROVINCE,
        title: '出产省份',
        width: 160,
        component: 'async-select',
        componentProps: (row) => {
          return {
            disabled: !row.data[PRODUCT_CODE],
            valueProp: 'province',
            labelProp: 'name',
            clearable: true,
            remoteMethod: getProvinces,
          }
        },
        effects: {
          onFieldValueChange(val, row) {
            // 清空城市列
            row.reset(PRODUCTION_CITY)
            row.setComponentProps(PRODUCTION_CITY, { options: [] })
            // 重新加载城市
            row.setLoading(PRODUCTION_CITY, true)
            getCities(val)
              .then((cities) => row.setComponentProps(PRODUCTION_CITY, { options: cities }))
              .finally(() => row.setLoading(PRODUCTION_CITY, false))
          },
        },
      },
      {
        field: PRODUCTION_CITY,
        title: '出产城市',
        width: 160,
        component: 'Select',
        componentProps: (row) => {
          const province = row.data[PRODUCTION_PROVINCE]
          return {
            disabled: !province,
            valueProp: 'city',
            labelProp: 'name',
            clearable: true,
          }
        },
        effects: {
          onFieldValueChange(val, row) {
            // 清空县区列
            row.reset(PRODUCTION_AREA)
            row.setComponentProps(PRODUCTION_AREA, { options: [] })
            // 重新加载县区
            row.setLoading(PRODUCTION_AREA, true)
            getAreas(row.data[PRODUCTION_PROVINCE], val)
              .then((areas) => row.setComponentProps(PRODUCTION_AREA, { options: areas }))
              .finally(() => row.setLoading(PRODUCTION_AREA, false))
          },
        },
      },
      {
        field: PRODUCTION_AREA,
        title: '出产县区',
        width: 160,
        component: 'Select',
        componentProps: (row) => {
          const city = row.data[PRODUCTION_CITY]
          return {
            disabled: !city,
            valueProp: 'area',
            labelProp: 'name',
            clearable: true,
          }
        },
      },
      {
        field: '[startDate, endDate]',
        title: '保质期',
        type: 'array',
        width: 220,
        asterisk: true,
        component: ElDatePicker,
        componentProps: {
          style: 'width: 200px',
          type: 'daterange',
          size: 'mini',
          clearable: true,
        },
        rule: {
          required: true,
          len: 2,
          validator: (val) => !!(val && val[0] && val[1]),
          message: '该字段必填',
        },
      },
      {
        field: 'creator',
        title: '创建人',
        width: 120,
        component: 'Input',
        componentProps: { placeholder: '请输入', clearable: true },
      },
      {
        field: 'action',
        virtual: true,
        title: '操作',
        width: 120,
        render(row) {
          const doAdd = () => {
            row.addRow()
            nextTick(() => row.toggleExpansion(true))
          }
          const doRemove = () => row.removeSelf()
          const addBtn = h(
            ElButton,
            { attrs: { type: 'text', size: 'mini' }, on: { click: doAdd } },
            '添加散件'
          )
          const removeBtn = h(
            ElButton,
            {
              attrs: { type: 'text', size: 'mini' },
              style: { color: 'red' },
              on: { click: doRemove },
            },
            '删除'
          )
          return [row.data.isGroup && addBtn, removeBtn]
        },
      },
    ]
    const wt = useWorktable({
      columns,
      layout: { pagination: true },
      initialData: [{ isGroup: true }],
    })

    function doSave() {
      const data = wt.getData()
      console.log('[save:data]: ', data)
    }

    function doValidate() {
      wt.validate().catch(() => {
        // not empty
      })
    }

    function doAdd() {
      wt.add()
      wt.gotoLastPage()
    }

    return {
      doSave,
      doValidate,
      doAdd,
    }
  },
})
</script>
