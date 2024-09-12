import { createApp } from 'vue'
import './style.css'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import {API_URL} from "./base.js";
import axios from "axios";
axios.defaults.baseURL = API_URL;


const app = createApp(App)
app.use(ElementPlus, {
    locale: zhCn,
})
app.mount('#app')
