import { createRouter, createWebHistory } from 'vue-router'
import loading from '@/components/loading'
import nProgress from 'nprogress'
import 'nprogress/nprogress.css'
import routes from './routes'

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(to => {
  loading.show()
  nProgress.start()
  document.title = to.meta.title ?? import.meta.env.VITE_APP_TITLE
})

router.afterEach(() => {
  window.scrollTo(0, 0)
  loading.close()
  nProgress.done()
})

export default router
