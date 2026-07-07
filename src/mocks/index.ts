/**
 * Mock 模块统一入口
 * 开发模式 + VITE_ENABLE_MOCK=true 时启动 browser worker
 * 测试模式由 setup.ts 直引 server.ts，生产构建时 tree-shake 移除
 */
export const startMock = async (): Promise<void> => {
  const enableMock = import.meta.env.VITE_ENABLE_MOCK === 'true'

  if (!enableMock || !import.meta.env.DEV) return

  try {
    const { startBrowserMock } = await import('./browser')
    await startBrowserMock()
    console.log('[MSW] Mock 已启用')
  } catch {
    console.warn('[MSW] 启动失败，所有请求将走真实网络')
  }
}
