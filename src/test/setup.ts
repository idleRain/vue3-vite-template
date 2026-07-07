import { afterAll, beforeAll, beforeEach, vi } from 'vitest'
import { mockConfig } from '@/mocks/config'
import { server } from '@/mocks/server'

// 创建内存存储模拟
const createStorageMock = () => {
  const storage = new Map<string, string>()

  return {
    getItem: vi.fn((key: string) => storage.get(key) || null),
    setItem: vi.fn((key: string, value: string) => {
      storage.set(key, value)
    }),
    removeItem: vi.fn((key: string) => {
      storage.delete(key)
    }),
    clear: vi.fn(() => {
      storage.clear()
    }),
    // 辅助方法用于测试
    _storage: storage
  }
}

const localStorageMock = createStorageMock()
const sessionStorageMock = createStorageMock()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
})

// 模拟 window.location
const locationMock = {
  href: 'http://localhost:3000',
  origin: 'http://localhost:3000',
  pathname: '/',
  search: '',
  hash: ''
}

Object.defineProperty(window, 'location', {
  value: locationMock,
  writable: true
})

// 测试套件启动时开启 MSW server，接管 fetch 请求拦截
// 同时强制启用所有 mock（无视 config.ts 中可能设为 false 的值），
// 避免 jsdom 环境尝试真实网络请求导致测试失败
beforeAll(() => {
  for (const key of Object.keys(mockConfig)) {
    ;(mockConfig as Record<string, boolean>)[key] = true
  }
  server.listen({ onUnhandledRequest: 'bypass' })
})

// 每个测试用例间重置 handler，确保测试隔离
beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
  sessionStorageMock.clear()
  locationMock.href = 'http://localhost:3000'
  server.resetHandlers()
})

// 测试套件结束后关闭 MSW server
afterAll(() => {
  server.close()
})
