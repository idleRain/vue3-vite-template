import { describe, it, expect } from 'vitest'
import { server } from '@/mocks/server'

describe('MSW server 生命周期', () => {
  it('server 实例包含 listen 方法', () => {
    expect(typeof server.listen).toBe('function')
  })

  it('server 实例包含 close 方法', () => {
    expect(typeof server.close).toBe('function')
  })

  it('server 实例包含 resetHandlers 方法', () => {
    expect(typeof server.resetHandlers).toBe('function')
  })
})
