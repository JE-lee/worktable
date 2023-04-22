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
import { defineComponent } from 'vue-demi'
import { useWorktable, Worktable } from '@edsheet/element-ui'
import { getProvinces, getCities, getAreas } from './api'

export default defineComponent({
  components: { Worktable },
  setup() {
    const columns = [
      {
        field: 'province',
        title: '省份',
        width: 160,
        component: 'async-select',
        componentProps: {
          valueProp: 'province',
          labelProp: 'name',
          remoteMethod: getProvinces,
        },
        effects: {
          onFieldValueChange(val, row) {
            // 清空城市列
            row.reset('city')
            row.setComponentProps('city', { options: [] })
            // 重新加载城市
            row.setLoading('city', true)
            getCities(val)
              .then((cities) => row.setComponentProps('city', { options: cities }))
              .finally(() => row.setLoading('city', false))
          },
        },
      },
      {
        field: 'city',
        title: '城市',
        width: 160,
        component: 'Select',
        componentProps: (row) => {
          const province = row.data.province
          return {
            disabled: !province,
            valueProp: 'city',
            labelProp: 'name',
          }
        },
        effects: {
          onFieldValueChange(val, row) {
            // 清空县区列
            row.reset('area')
            row.setComponentProps('area', { options: [] })
            // 重新加载县区
            row.setLoading('area', true)
            getAreas(row.data.province, val)
              .then((areas) => row.setComponentProps('area', { options: areas }))
              .finally(() => row.setLoading('area', false))
          },
        },
      },
      {
        field: 'area',
        title: '县区',
        width: 160,
        component: 'Select',
        componentProps: (row) => {
          const city = row.data.city
          return {
            disabled: !city,
            valueProp: 'area',
            labelProp: 'name',
          }
        },
      },
    ]
    const wt = useWorktable({ columns })

    // 添加一条空数据
    wt.add()

    function doValidate() {
      wt.validate()
        .then(() => {
          console.log('validate successed')
        })
        .catch((err) => {
          console.error(err)
        })
    }
    async function doSubmit() {
      await wt.validate()
      const data = wt.getData()
      console.log('data', data)
    }

    return {
      doValidate,
      doSubmit,
    }
  },
})
</script>
