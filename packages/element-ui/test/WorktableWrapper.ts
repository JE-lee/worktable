import { defineComponent, h, nextTick } from 'vue-demi'
import { Worktable, useWorktable } from '../src'
import type { UIColumn } from '../src'
import { getProducts, getProvinces, getCities, getAreas, save } from './api'
import { Button as ElButton, Checkbox as ElCheckbox, DatePicker as ElDatePicker } from 'element-ui'
import { FIELD_EVENT_NAME, RowProxy } from '@edsheet/core'

const PRODUCT_CODE = 'productCode'
const PRODUCT = `{${PRODUCT_CODE}, productName}`
const PRODUCTION_PROVINCE = 'productionProvince'
const PRODUCTION_CITY = 'productionCity'
const PRODUCTION_AREA = 'productionArea'

export default defineComponent({
  name: 'WorktableWrapper',
  setup() {
    const columns: UIColumn[] = [
      {
        field: 'seq',
        title: '序号',
        value: (row) => {
          return row.parent ? `${row.parent.index + 1}-${row.index + 1}` : row.index + 1
        },
        width: 80,
        componentProps: {
          ['data-seq']: true,
        },
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
          fresh: true,
          'data-product': true,
          popperClass: 'data-product-dropdown',
        },
        required: true,
        rule: {
          validator(val: any) {
            if (!val.productCode) throw '请选择商品'
          },
        },
      },
      {
        field: PRODUCT_CODE,
        title: '商品编码',
        width: 140,
        componentProps: {
          'data-productcode': true,
        },
      },
      {
        field: 'isGroup',
        type: 'boolean',
        title: '是否组合商品',
        width: 120,
        component: (row) => (row.parent ? 'render' : ElCheckbox),
        componentProps: {
          'data-isgroup': true,
          render: (row: RowProxy) => {
            if (row.parent) {
              return '-'
            }
          },
        },
        effects: {
          [FIELD_EVENT_NAME.ON_FIELD_VALUE_CHANGE]: (val, row) => {
            val = val as boolean
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
          'data-count': true,
        },
        required: true,
        requiredMessage: '缺少数量',
        rule: {
          validator(val: any, row) {
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
            ['data-province']: true,
            popperClass: 'data-province-dropdown',
          }
        },
        effects: {
          onFieldValueChange(val, row) {
            // 清空城市列
            row.reset(PRODUCTION_CITY)
            row.setComponentProps(PRODUCTION_CITY, { options: [] })
            // 重新加载城市
            row.setLoading(PRODUCTION_CITY, true)
            getCities(val as string)
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
            ['data-city']: true,
            popperClass: 'data-city-dropdown',
          }
        },
        effects: {
          onFieldValueChange(val, row) {
            // 清空县区列
            row.reset(PRODUCTION_AREA)
            row.setComponentProps(PRODUCTION_AREA, { options: [] })
            // 重新加载县区
            row.setLoading(PRODUCTION_AREA, true)
            getAreas(row.data[PRODUCTION_PROVINCE] as string, val as string)
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
            ['data-area']: true,
            popperClass: 'data-area-dropdown',
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
          ['data-expire']: true,
        },
        rule: {
          required: true,
          len: 2,
          validator: (val: any) => !!(val && val[0] && val[1]),
          message: '该字段必填',
        },
      },
      {
        field: 'creator',
        title: '创建人',
        width: 120,
        component: 'Input',
        componentProps: { placeholder: '请输入', clearable: true, ['data-creator']: true },
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
            { attrs: { id: 'add-child', type: 'text', size: 'mini' }, on: { click: doAdd } },
            '添加散件'
          )
          const removeBtn = h(
            ElButton,
            {
              attrs: { id: 'remove-row', type: 'text', size: 'mini' },
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
      initialData: [{}],
    })

    function doSave() {
      const data = wt.getData()
      save(data)
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

    let visible = true
    function doToggle() {
      wt.toggleColumnVisibility(['seq', PRODUCT], (visible = !visible))
    }

    return () => {
      const worktable = h(Worktable, { attrs: { border: true }, style: { marginTop: '20px' } })
      const saveBtn = h(
        ElButton,
        { on: { click: doSave }, attrs: { id: 'save', size: 'small', type: 'primary' } },
        '保存'
      )
      const validateBtn = h(
        ElButton,
        { on: { click: doValidate }, attrs: { id: 'validate', size: 'small', type: 'primary' } },
        '校验'
      )
      const addBtn = h(
        ElButton,
        { on: { click: doAdd }, attrs: { id: 'add', size: 'small' } },
        '添加商品'
      )
      const toggleColumnVisibilityBtn = h(
        ElButton,
        { on: { click: doToggle }, attrs: { id: 'toggleColumnVisibility', size: 'small' } },
        '添加商品'
      )
      const btns = h('div', [saveBtn, validateBtn, addBtn, toggleColumnVisibilityBtn])
      return h('div', [btns, worktable])
    }
  },
})
