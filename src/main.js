import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import 'normalize.css'
import '@/utils/flexible'  // 响应式布局用的

// element-plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// pinia store
import { createPinia } from 'pinia'
const pinia = createPinia()
// router
import router from '@/router'
// form-create
import formCreate from '@form-create/element-ui'

createApp(App)
  .use(router)
  .use(pinia)
  .use(ElementPlus)
  .use(formCreate)
  .mount('#app')
