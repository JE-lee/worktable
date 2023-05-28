(window.webpackJsonp=window.webpackJsonp||[]).push([[44],{430:function(n,e,t){"use strict";t.r(e),e.default="<template>\n  <div>\n    <div>\n      <el-button type=\"primary\" size=\"small\" @click=\"doSave\">保存（已打印在控制台）</el-button>\n      <el-button type=\"primary\" size=\"small\" @click=\"doValidate\">校验</el-button>\n      <el-button size=\"small\" @click=\"doAdd\">添加商品</el-button>\n    </div>\n    <Worktable style=\"margin-top: 20px\" border></Worktable>\n  </div>\n</template>\n\n<script>\nimport { defineComponent, h, nextTick } from 'vue-demi'\nimport { Worktable, useWorktable } from '@edsheet/element-ui'\nimport { getProducts, getProvinces, getCities, getAreas } from './api'\nimport { Button as ElButton, Checkbox as ElCheckbox, DatePicker as ElDatePicker } from 'element-ui'\n\nconst PRODUCT_CODE = 'productCode'\nconst PRODUCT = `{${PRODUCT_CODE}, productName}`\nconst PRODUCTION_PROVINCE = 'productionProvince'\nconst PRODUCTION_CITY = 'productionCity'\nconst PRODUCTION_AREA = 'productionArea'\n\nexport default defineComponent({\n  name: 'WorktableWrapper',\n  components: { Worktable },\n  setup() {\n    const columns = [\n      {\n        field: 'seq',\n        title: '序号',\n        value: (row) => {\n          return row.parent ? `${row.parent.index + 1}-${row.index + 1}` : row.index + 1\n        },\n        width: 80,\n      },\n      {\n        field: PRODUCT,\n        type: 'object',\n        title: '商品',\n        component: 'async-select',\n        width: 180,\n        componentProps: {\n          optionInValue: true,\n          labelProp: 'productName',\n          valueProp: 'productCode',\n          remoteMethod: getProducts,\n          clearable: true,\n        },\n        required: true,\n        rule: {\n          validator(val) {\n            if (!val.productCode) throw '请选择商品'\n          },\n        },\n      },\n      {\n        field: PRODUCT_CODE,\n        title: '商品编码',\n        width: 140,\n      },\n      {\n        field: 'isGroup',\n        type: 'boolean',\n        title: '是否组合商品',\n        width: 120,\n        component: (row) => (row.parent ? 'render' : ElCheckbox),\n        componentProps: {\n          render: (row) => {\n            if (row.parent) {\n              return '-'\n            }\n          },\n        },\n        effects: {\n          onFieldValueChange: (val, row) => {\n            if (!val) {\n              row.removeAllRow()\n            }\n          },\n        },\n        default: false,\n      },\n      {\n        field: 'count',\n        type: 'number',\n        title: '数量',\n        width: 140,\n        component: 'Input',\n        componentProps: {\n          type: 'number',\n          placeholder: '请输入',\n        },\n        required: true,\n        requiredMessage: '缺少数量',\n        rule: {\n          validator(val, row) {\n            if (val <= 0) throw '要求是正数'\n            if (row.data.isGroup && val > 1) throw '组合商品数量不能大于1'\n          },\n        },\n        default: 10,\n      },\n      {\n        field: PRODUCTION_PROVINCE,\n        title: '出产省份',\n        width: 160,\n        component: 'async-select',\n        componentProps: (row) => {\n          return {\n            disabled: !row.data[PRODUCT_CODE],\n            valueProp: 'province',\n            labelProp: 'name',\n            clearable: true,\n            remoteMethod: getProvinces,\n          }\n        },\n        effects: {\n          onFieldValueChange(val, row) {\n            // 清空城市列\n            row.reset(PRODUCTION_CITY)\n            row.setComponentProps(PRODUCTION_CITY, { options: [] })\n            // 重新加载城市\n            row.setLoading(PRODUCTION_CITY, true)\n            getCities(val)\n              .then((cities) => row.setComponentProps(PRODUCTION_CITY, { options: cities }))\n              .finally(() => row.setLoading(PRODUCTION_CITY, false))\n          },\n        },\n      },\n      {\n        field: PRODUCTION_CITY,\n        title: '出产城市',\n        width: 160,\n        component: 'Select',\n        componentProps: (row) => {\n          const province = row.data[PRODUCTION_PROVINCE]\n          return {\n            disabled: !province,\n            valueProp: 'city',\n            labelProp: 'name',\n            clearable: true,\n          }\n        },\n        effects: {\n          onFieldValueChange(val, row) {\n            // 清空县区列\n            row.reset(PRODUCTION_AREA)\n            row.setComponentProps(PRODUCTION_AREA, { options: [] })\n            // 重新加载县区\n            row.setLoading(PRODUCTION_AREA, true)\n            getAreas(row.data[PRODUCTION_PROVINCE], val)\n              .then((areas) => row.setComponentProps(PRODUCTION_AREA, { options: areas }))\n              .finally(() => row.setLoading(PRODUCTION_AREA, false))\n          },\n        },\n      },\n      {\n        field: PRODUCTION_AREA,\n        title: '出产县区',\n        width: 160,\n        component: 'Select',\n        componentProps: (row) => {\n          const city = row.data[PRODUCTION_CITY]\n          return {\n            disabled: !city,\n            valueProp: 'area',\n            labelProp: 'name',\n            clearable: true,\n          }\n        },\n      },\n      {\n        field: '[startDate, endDate]',\n        title: '保质期',\n        type: 'array',\n        width: 220,\n        asterisk: true,\n        component: ElDatePicker,\n        componentProps: {\n          style: 'width: 200px',\n          type: 'daterange',\n          size: 'mini',\n          clearable: true,\n        },\n        rule: {\n          required: true,\n          len: 2,\n          validator: (val) => !!(val && val[0] && val[1]),\n          message: '该字段必填',\n        },\n      },\n      {\n        field: 'creator',\n        title: '创建人',\n        width: 120,\n        component: 'Input',\n        componentProps: { placeholder: '请输入', clearable: true },\n      },\n      {\n        field: 'action',\n        virtual: true,\n        title: '操作',\n        width: 120,\n        render(row) {\n          const doAdd = () => {\n            row.addRow()\n            nextTick(() => row.toggleExpansion(true))\n          }\n          const doRemove = () => row.removeSelf()\n          const addBtn = h(\n            ElButton,\n            { attrs: { type: 'text', size: 'mini' }, on: { click: doAdd } },\n            '添加散件'\n          )\n          const removeBtn = h(\n            ElButton,\n            {\n              attrs: { type: 'text', size: 'mini' },\n              style: { color: 'red' },\n              on: { click: doRemove },\n            },\n            '删除'\n          )\n          return [row.data.isGroup && addBtn, removeBtn]\n        },\n      },\n    ]\n    const wt = useWorktable({\n      columns,\n      layout: { pagination: true },\n      initialData: [{ isGroup: true }],\n    })\n\n    function doSave() {\n      const data = wt.getData()\n      console.log('[save:data]: ', data)\n    }\n\n    function doValidate() {\n      wt.validate().catch(() => {\n        // not empty\n      })\n    }\n\n    function doAdd() {\n      wt.add()\n      wt.gotoLastPage()\n    }\n\n    return {\n      doSave,\n      doValidate,\n      doAdd,\n    }\n  },\n})\n<\/script>\n"}}]);