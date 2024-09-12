<script setup>
import { ref } from 'vue'
import {Select, Position} from "@element-plus/icons-vue";
import {showElMessage} from "../utils/notification.js";
const emits = defineEmits(['confirmUpload'])

let dataset_file = null
const dataset_desc = ref('')
const upload = ref(null)
const confirmUpload = () => {
  // 确认上传
  if (dataset_file) {
    emits('confirmUpload', dataset_file, dataset_desc.value)
  }else{
    // 上传数据集文件
    showElMessage('请选择数据集文件', 'warning', 3000, true)
  }
}
const handleFileRemove = (file, files) => {
  // 处理文件移除
  dataset_file = null
}
const handleFileChange = (file, files) => {
  // 处理文件选择
  dataset_file = file.raw
  // 为了统一显示状态，这里手动设置状态为成功
  file.status = 'success'
}
const handleFileSelectExceed = (file, files) => {
  // 处理文件选择超出限制
  // 替换文件
  files[0] = file[0]
  dataset_file = file[0]
}
</script>

<template>
  <div>
    <el-form label-position="left" label-width="auto">
      <el-form-item label="数据集选择">
        <el-upload
            ref="upload"
            :limit="1"
            :on-remove="handleFileRemove"
            :on-change="handleFileChange"
            :on-exceed="handleFileSelectExceed"
            accept=".zip"
            :auto-upload="false">
          <template #trigger>
            <el-button type="success" :icon="Select">选择数据集文件</el-button>
          </template>
        </el-upload>
      </el-form-item>
      <el-form-item label="数据集描述">
        <el-input v-model="dataset_desc" type="textarea" :rows="4"/>
      </el-form-item>
    </el-form>
  </div>
  <div class="dialog-footer" style="display: flex; justify-content: space-evenly; align-items: center; flex-wrap: nowrap">
    <el-button type="primary" @click="confirmUpload" :icon="Position">
      确定上传
    </el-button>
  </div>
</template>

<style scoped>

</style>