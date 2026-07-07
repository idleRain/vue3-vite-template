import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)

/** 启动 mock：listen/resetHandlers/close 生命周期由调用方控制 */
export const startServerMock = (): void => {
  server.listen({
    onUnhandledRequest: 'bypass'
  })
}

export const stopServerMock = (): void => {
  server.close()
}

/** 各测试用例间重置 handler，保证隔离 */
export const resetServerMock = (): void => {
  server.resetHandlers()
}
