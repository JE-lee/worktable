<template>
  <div>
    <div class="trigger" @click="dialogVisible = true">
      <el-tag v-if="value && value.id">{{ value.name }}</el-tag>
      <el-tag v-else effect="plain" @click="dialogVisible = true" style="cursor: pointer">请选择</el-tag>

    </div>
    <el-dialog title="选择用户" :visible.sync="dialogVisible" width="50%" @close="handleClose">
      <el-table :data="users" style="width: 100%" highlight-current-row @current-change="handleSelectionChange">
        <!-- <el-table-column type="selection" width="55">
        </el-table-column> -->
        <el-table-column prop="id" label="id">
        </el-table-column>
        <el-table-column prop="name" label="姓名">
        </el-table-column>
        <el-table-column prop="age" label="年龄">
        </el-table-column>
        <el-table-column prop="address" label="地址">
        </el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button size="mini" @click="dialogVisible = false">取 消</el-button>
        <el-button size="mini" type="primary" @click="doSure">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { defineComponent, ref, shallowRef } from 'vue'
export default defineComponent({
  props: {
    value: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props, { emit }) {
    const dialogVisible = ref(false)
    const users = [
      {
        id: 1,
        name: '王子花',
        age: 14,
        address: '雍和小区'
      },
      {
        id: 2,
        name: '王子画',
        age: 23,
        address: '雍和小区'
      },
      {
        id: 3,
        name: '王子化',
        age: 18,
        address: '雍和小区'
      },
      {
        id: 4,
        name: '王子滑',
        age: 55,
        address: '雍和小区'
      }
    ]

    const selection = shallowRef({})

    function handleSelectionChange(val) {
      selection.value = val
    }

    function handleClose() {
      selection.value = {}
    }

    function doSure() {
      emit('input', selection.value)
      dialogVisible.value = false
    }

    return {
      users,
      dialogVisible,
      handleSelectionChange,
      handleClose,
      doSure
    }
  },
  methods: {
    focus() {
      this.dialogVisible = true
    }
  }

})
</script>

