<template>
  <div class="container" style="display: flex; flex-direction: column">
    <div class="flex-row-center-wrap" style="margin-bottom: 5px">
      <el-popover placement="right" trigger="hover" width="350">
        <template #reference>
          <el-button type="success" :icon="Upload">上传列表</el-button>
        </template>
        <div v-if="file_upload_status.length === 0"
             style="width: 100%; overflow-x: auto; overflow-y: hidden;">
          <p style="text-align: center">暂无上传任务</p>
        </div>
        <div v-else style="width: 100%; overflow-x: auto; overflow-y: hidden;">
          <FileUpload v-for="file in file_upload_status" :key="file.dataset_file.uuid" :dataset_file="file.dataset_file"
                      :dataset_desc="file.dataset_desc" :percentage="file.percentage"  @upload-finish="getDatasetsList"/>
        </div>
      </el-popover>
      <div>
        <el-button type="primary" @click="file_select_dialog_visible = true" :icon="Files">上传数据集</el-button>
        <el-popover placement="left" :width="400"  trigger="hover">
          <template #reference>
            <el-link type="primary" @click="showFormatExample" style="margin-left: 10px">数据集格式示例</el-link>
          </template>
          <div style="overflow-y: scroll; max-height: 500px">
            <DatasetExample/>
          </div>

        </el-popover>

        <el-link type="danger" @click="downloadExampleDataset" style="margin-left: 10px">下载示例</el-link>
      </div>

      <div>
        <el-input v-model="search_args.dataset_desc" placeholder="搜索数据集" clearable style="width: 250px">
          <template #append>
            <div>
              <el-button :icon="Search" @click="searchDatasets"></el-button>
            </div>
          </template>
        </el-input>
      </div>

    </div>
    <!-- 表格和分页器 -->
    <div class="flex-column-center-wrap">
      <el-table :data="datasetList" style="width: 99%; margin-bottom: 40px" border>
        <el-table-column prop="dataset_id" label="文件ID" sortable width="120"/>
        <el-table-column prop="dataset_filename" label="文件名" sortable/>
        <el-table-column prop="dataset_desc" label="数据集描述(备注)" sortable width="400">
          <template #default="{row}">
            <div
                style="display: flex; flex-direction: row; flex-wrap: nowrap; align-items: center; justify-content: center">
              <el-input type="textarea" :rows="3" :value="row.dataset_desc" disabled/>
              <el-link type="primary" style="margin-left: 10px; white-space: nowrap" @click="updateDatasetDescDialogShow(row)">
                修改
              </el-link>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="dataset_url" label="内部存储地址" sortable width="400">
          <template #default="{row}">
            <div
                style="display: flex; flex-direction: row; flex-wrap: nowrap; align-items: center; justify-content: center">
              <el-text type="warning">{{ row.dataset_url }}</el-text>
              <el-link type="primary" style="margin-left: 10px; white-space: nowrap" @click="copyContentToClipboard(row.dataset_url)">复制
              </el-link>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="上传时间" sortable width="180">
          <template #default="{row}">
            {{ reformatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="修改时间" sortable width="180">
          <template #default="{row}">
            {{ reformatDate(row.updated_at) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200">
          <template #default="{row}">
            <div
                style="display: flex; flex-direction: row; flex-wrap: nowrap; align-items: center; justify-content: center">
              <el-button type="primary" :icon="Download" @click="downloadDataset(row.dataset_id)">下载</el-button>
              <el-button type="danger" :icon="Delete" @click="deleteDataset(row.dataset_id, row.dataset_url)">删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

  </div>
  <div class="flex-row-center bottom-fixed" style="width: 100%; z-index: 1; background-color: white">
    <el-pagination
        v-model:current-page="search_args.current_page"
        v-model:page-size="search_args.page_size"
        :page-sizes="[10, 20, 30, 50]"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="dataset_total_size"
        @size-change="handlePageSizeChange"
        @current-change="handleCurrentPageChange"/>
  </div>
  <el-dialog
      center
      destroy-on-close
      v-model="file_select_dialog_visible"
      title="文件选择"
      width="40%"
      style="min-width: 350px"
      :before-close="handleFileSelectDialogClose">
    <FileSelect @confirm-upload="confirmUpload"/>
  </el-dialog>
  <el-dialog
      destroy-on-close
      center
      v-model="dataset_desc_dialog_visible"
      title="修改数据集描述(备注)"
      width="40%">
    <el-form label-position="left" label-width="auto">
      <el-form-item label="文件名">
        <el-text>{{ current_row.dataset_filename }}</el-text>
      </el-form-item>
      <el-form-item label="上传时间">
        <el-text>{{ reformatDate(current_row.created_at) }}</el-text>
      </el-form-item>
      <el-form-item label="新的数据集描述">
        <el-input v-model="current_row.dataset_desc" type="textarea" :rows="4"/>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dataset_desc_dialog_visible = false">取消</el-button>
        <el-button type="primary" @click="updateDatasetDesc">
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
// 导入必要的组件和函数
import {ref, reactive, onMounted} from 'vue'
import {Search, Upload, Files, Download, Delete} from "@element-plus/icons-vue";
import {ElLoading, ElMessageBox} from "element-plus";
import FileSelect from "./components/FileSelect.vue";
import {showElMessage} from "./utils/notification.js";
import FileUpload from "./components/FileUpload.vue";
import axios from "axios";
import JSZip from "jszip";
import DatasetExample from "./components/DatasetExample.vue";

const dataset_desc_dialog_visible = ref(false)
const current_row = ref({
  dataset_id: 0,
  dataset_filename: '',
  created_at: '',
  dataset_desc: ''
})
const updateDatasetDesc = () => {
  // 更新数据集描述
  axios.post('/dataset/update/desc', {
    dataset_id: current_row.value.dataset_id,
    dataset_desc: current_row.value.dataset_desc
  }).then((response) => {
    let data = response.data
    if (data.type === 'success') {
      showElMessage('更新成功', 'success', 3000, true)
      getDatasetsList()
    } else {
      showElMessage(data.msg, 'error', 3000, true)
    }
  }).catch((error) => {
    showElMessage('更新失败', 'error', 3000, true)
  }).finally(() => {
    dataset_desc_dialog_visible.value = false
  })
}
const updateDatasetDescDialogShow = (row) => {
  // 更新数据集描述
  current_row.value = JSON.parse(JSON.stringify(row))
  dataset_desc_dialog_visible.value = true
}
const deleteDataset = (dataset_id, dataset_url) => {
  // 删除数据集
  ElMessageBox.confirm('确定删除该数据集?')
      .then(() => {
        axios.post('/dataset/delete', {dataset_id: dataset_id, dataset_url: dataset_url})
            .then((response) => {
              let data = response.data
              if (data.type === 'success') {
                showElMessage('删除成功', 'success', 3000, true)
                getDatasetsList()
              } else {
                showElMessage('删除失败', 'error', 3000, true)
              }
            }).catch((error) => {
          showElMessage('删除失败', 'error', 3000, true)
        })
      })
      .catch(() => {
        // catch error
      })
}
const downloadExampleDataset = () => {
  // 下载示例数据集
  axios.get('/dataset/example').then((response) => {
    let data = response.data
    if (data.type === 'success') {
      window.open(axios.defaults.baseURL + '/dataset/download/begin?token=' + data.token, '_blank')
    } else {
      showElMessage('下载失败', 'error', 3000, true)
    }
  }).catch((error) => {
    showElMessage('下载失败', 'error', 3000, true)
  })
}
const downloadDataset = (dataset_id) => {
  // 下载数据集
  // # 1. 获取下载token
  // # 2. open new window with download url and token
  axios.get('/dataset/download/token', {
    params: {
      dataset_id: dataset_id
    }
  }).then((response) => {
    let data = response.data
    if (data.type === 'success') {
      window.open(axios.defaults.baseURL + '/dataset/download/begin?token=' + data.token, '_blank')
    } else {
      showElMessage('下载失败', 'error', 3000, true)
    }
  }).catch((error) => {
    showElMessage('下载失败', 'error', 3000, true)
  })
}
const copyContentToClipboard = (content) => {
  // 复制内容到剪贴板
  navigator.clipboard.writeText(content)
      .then(() => {
        showElMessage('复制成功', 'success', 3000, true)
      })
      .catch(() => {
        showElMessage('复制失败', 'error', 3000, true)
      })
}
const file_upload_status = ref([])
const reformatDate = (date) => {
  // 重新格式化日期
  return new Date(date).toLocaleString()
}
const confirmUpload = (dataset_file, dataset_desc) => {
  // 确认上传
  // 校验目录结构
  const reader = new FileReader();
  let train_images_count = 0
  let train_labels_count = 0
  let test_images_count = 0
  let test_labels_count = 0
  let val_images_count = 0
  let val_labels_count = 0
  let has_classes = false
  reader.onload = async (e) => {
    // 全局loading
    const loading = ElLoading.service({
      lock: true,
      text: '数据集格式校验中...',
      background: 'rgba(0, 0, 0, 0.7)',
    })
    const arrayBuffer = e.target.result;
    // 加载 ZIP 文件，但不解压缩
    const zip = await JSZip.loadAsync(arrayBuffer, {createFolders: true});
    // 遍历 ZIP 文件的目录结构
    zip.forEach((relativePath, file) => {
      // console.log(`Path: ${relativePath} | Folder: ${file.dir}`);
      // 必须含有3个 '/' 的路径才是文件
      if (relativePath === 'classes.txt') {
        has_classes = true
      } else if (relativePath.split('/').length === 3) {
        if (relativePath.startsWith('train/images')) {
          train_images_count++
        } else if (relativePath.startsWith('train/labels')) {
          train_labels_count++
        } else if (relativePath.startsWith('test/images')) {
          test_images_count++
        } else if (relativePath.startsWith('test/labels')) {
          test_labels_count++
        } else if (relativePath.startsWith('val/images')) {
          val_images_count++
        } else if (relativePath.startsWith('val/labels')) {
          val_labels_count++
        }
      }
    });
    // 取消全局loading
    loading.close()
    if (train_images_count === train_labels_count && test_images_count === test_labels_count && val_images_count === val_labels_count && has_classes) {
      file_upload_status.value.push({
        dataset_file: dataset_file,
        dataset_desc: dataset_desc,
        percentage: 0
      })
      file_select_dialog_visible.value = false
      showElMessage('上传中，已加入任务队列。', 'info', 3000, true)
    } else {
      showElMessage('数据集目录结构错误，请核对格式示例', 'error', 3000, true)
    }
  };
  reader.readAsArrayBuffer(dataset_file);
}

const file_select_dialog_visible = ref(false)
const handleFileSelectDialogClose = (done) => {
  // 处理文件选择对话框关闭
  ElMessageBox.confirm('信息将不会保存，确定关闭?')
      .then(() => {
        done()
      })
      .catch(() => {
        // catch error
      })
}
onMounted(() => {
  // 初始化数据
  getDatasetsList()
})
// 搜索文本
const search_args = reactive({
  current_page: 1,
  page_size: 10,
  dataset_desc: '',
})

// 搜索数据集
const searchDatasets = () => {
  // 搜索数据集
  search_args.current_page = 1
  getDatasetsList()
}
// 请求数据集列表
const getDatasetsList = () => {
  // 根据searchText搜索数据集,并更新datasetList
  axios.post('/dataset/list',
      {
        current_page: search_args.current_page,
        page_size: search_args.page_size,
        dataset_desc: search_args.dataset_desc
      }
  ).then((response) => {
    let data = response.data
    if (data.type === 'success') {
      datasetList.value = data.datasets
      dataset_total_size.value = data.count
    } else {
      showElMessage('数据集加载失败', 'error', 3000, true)
    }
  }).catch((error) => {
    showElMessage('数据集加载失败', 'error', 3000, true)
  })
}


// 显示格式示例
const showFormatExample = () => {
  // 显示格式示例页面或模态框
}

const dataset_total_size = ref(0)

// 处理页码大小变化
const handlePageSizeChange = (page_size) => {
  // 处理页码大小变化
  getDatasetsList()
}

// 处理当前页码变化
const handleCurrentPageChange = (current_page) => {
  // 处理当前页码变化
  getDatasetsList()
}

// 数据集列表
const datasetList = ref([])

</script>
<style scoped>
.bottom-fixed {
  position: fixed;
  bottom: 0;
  width: 100%;
}

.flex-row-center {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
}

.flex-row-center-wrap {
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-wrap: wrap;
}

.flex-column-center {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
}

.flex-column-center-wrap {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}
</style>