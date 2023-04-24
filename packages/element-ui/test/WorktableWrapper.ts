import { defineComponent, h } from 'vue-demi'
import { Worktable, useWorktable } from '../src'
import type { UIColumn } from '../src'
import { getProducts, getProvinces, getCities, getAreas, save } from './api'
import { Button as ElButton } from 'element-ui'

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
        value: (row: any) => row.index + 1,
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
        width: 140,
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
      },
      {
        field: PRODUCT_CODE,
        title: '商品编码',
        componentProps: {
          'data-productcode': true,
        },
      },
      {
        field: 'count',
        type: 'number',
        title: '数量',
        component: 'Input',
        componentProps: {
          type: 'number',
          placeholder: '请输入',
          'data-count': true,
        },
        required: true,
        rule: {
          max: 100,
          message: 'can not greater than 100',
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
        field: 'creator',
        title: '创建人',
        component: 'Input',
        componentProps: { placeholder: '请输入', clearable: true, ['data-creator']: true },
      },
    ]
    const wt = useWorktable({ columns })
    wt.add()

    function doSave() {
      const data = wt.getData()
      save(data)
    }
    return () => {
      const worktable = h(Worktable, { props: { border: true } })
      const saveBtn = h(ElButton, { on: { click: doSave }, attrs: { id: 'save' } }, '保存')
      const btns = h('div', [saveBtn])
      return h('div', [btns, worktable])
    }
  },
})
