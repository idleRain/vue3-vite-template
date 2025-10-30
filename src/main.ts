import { setupI18n } from '@/i18n'
import { createApp } from 'vue'
import router from '@/router'
import '@/styles/index.css'
import App from './App.vue'
import pinia from '@/store'

const bootstrap = async () => {
  const app = createApp(App)

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

  await setupI18n(app)

  app.use(pinia)
  app.use(router)

  app.mount('#app')
}

void bootstrap()
