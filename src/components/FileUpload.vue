<script setup>
import { ref, onMounted } from 'vue'
import axios from "axios";
import {showElMessage} from "../utils/notification.js";
const emits = defineEmits(['uploadFinish'])

const props = defineProps({
  dataset_file: {
    type: Object,
    required: true
  },
  dataset_desc: {
    type: String,
    required: true
  }
})
const percentage = ref(0)
onMounted(() => {
  // 上传文件
  const formData = new FormData()
  formData.append('dataset_file', props.dataset_file)
  formData.append('dataset_desc', props.dataset_desc)
  axios.post('/dataset/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (progressEvent) => {
      percentage.value = Math.round((progressEvent.loaded / progressEvent.total) * 100)
    }
  })
    .then(response => {
      let data = response.data
      if (data.type === 'success'){
        // 上传成功
        showElMessage(`${props.dataset_file.name} 上传完成`, 'success', 3000, true)
        emits('uploadFinish')
      }else{
        // 上传失败
        showElMessage(data.msg, 'error', 3000, true)
      }
    })
    .catch(error => {
      console.log(error)
    })
})
const cal_color = () => {
  if (percentage.value < 50){
    return '#909399'
  }else if (percentage.value < 80){
    return '#409EFF'
  }else{
    return '#67C23A'
  }
}
</script>

<template>
  <div style="height: 100%; display: flex; align-items: center;">
    <el-progress
        :width="70"
        :color="cal_color"
        :percentage="percentage"
        type="circle"/>
    <span>{{props.dataset_file.name}}</span>
  </div>
</template>

<style scoped>

</style>