import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

/** 启动浏览器端 mock：未匹配请求透传 */
export const startBrowserMock = async (): Promise<void> => {
  await worker.start({
    onUnhandledRequest: 'bypass'
  })
}
