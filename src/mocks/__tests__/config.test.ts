import { describe, it, expect } from 'vitest'
import { mockConfig } from '@/mocks/config'

describe('mockConfig', () => {
  it('所有接口默认 mock 均启用', () => {
    for (const value of Object.values(mockConfig)) {
      expect(value).toBe(true)
    }
  })

  it('包含已知接口 key', () => {
    expect(mockConfig).toHaveProperty('POST /api/example/hello')
  })

  it('key 数量与预期一致', () => {
    expect(Object.keys(mockConfig)).toHaveLength(1)
  })
})
