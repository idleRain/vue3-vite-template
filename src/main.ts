import { type App as VueApp, createApp } from 'vue'
import { local } from '@/utils/storage.ts'
import { setupI18n } from '@/i18n'
import router from '@/router'
import '@/styles/index.css'
import App from './App.vue'
import pinia from '@/store'

// 初始化暗色模式：从 localStorage 读取用户偏好，立即应用到 <html>
const initColorScheme = () => {
  const saved = local.get('vueuse-color-scheme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  if (saved === 'dark' || (!saved && prefersDark)) {
    document.documentElement.classList.add('dark')
  }
}

// 初始化错误日志
const initErrorLog = (app: VueApp) => {
  app.config.errorHandler = (err: any, instance, info) => {
    console.groupCollapsed(
      `%c❌[DEBUG] 错误日志: ${err.toString()}`,
      'color: #ff0000; font-weight: bold'
    )
    console.error('Error:', err)
    console.error('Instance:', instance)
    console.error('Info:', info)
    console.groupEnd()
  }
}

const bootstrap = async () => {
  const app = createApp(App)

  initColorScheme()
  initErrorLog(app)
  await setupI18n(app)

  app.use(pinia)
  app.use(router)

  app.mount('#app')
}

void bootstrap()
