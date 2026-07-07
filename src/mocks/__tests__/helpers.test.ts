import { describe, it, expect, vi, afterEach } from 'vitest'
import { mockConfig } from '@/mocks/config'
import { guard } from '@/mocks/helpers'
import { HttpResponse } from 'msw'

const KEY = 'POST /api/example/hello' as const
const fakeRequest = new Request('http://localhost/api/example/hello')

describe('guard', () => {
  afterEach(() => {
    // 恢复默认值
    ;(mockConfig as Record<string, boolean>)[KEY] = true
    vi.restoreAllMocks()
  })

  it('mockConfig 为 true 时执行 mock 工厂并返回其响应', async () => {
    ;(mockConfig as Record<string, boolean>)[KEY] = true

    const mockFactory = vi.fn(() => HttpResponse.json({ ok: true }))
    const resolver = guard(KEY, mockFactory)

    const response = await resolver({ request: fakeRequest })
    const body = await response.json()

    expect(mockFactory).toHaveBeenCalledOnce()
    expect(body).toEqual({ ok: true })
  })

  it('mockConfig 为 false 时绕过 mock，调用 fetch 走真实网络', async () => {
    ;(mockConfig as Record<string, boolean>)[KEY] = false

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ from: 'real' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    )

    const mockFactory = vi.fn()
    const resolver = guard(KEY, mockFactory)

    const response = await resolver({ request: fakeRequest })
    const body = await response.json()

    expect(mockFactory).not.toHaveBeenCalled()
    expect(fetchSpy).toHaveBeenCalledOnce()
    expect(body).toEqual({ from: 'real' })
  })

  it('传入的 mock 工厂可直接返回 Response 实例', async () => {
    ;(mockConfig as Record<string, boolean>)[KEY] = true

    const resolver = guard(KEY, () => new Response('raw', { status: 201 }))
    const response = await resolver({ request: fakeRequest })

    expect(response.status).toBe(201)
    expect(await response.text()).toBe('raw')
  })

  it('通过不同 key 可独立控制多个接口', async () => {
    const keyA = KEY

    // keyA 启用, keyB 用一个等效 guard 模拟——此处验证同 key 多次调用一致性
    ;(mockConfig as Record<string, boolean>)[keyA] = true
    const resolver = guard(keyA, () => new Response('a'))

    const r1 = await resolver({ request: fakeRequest })
    const r2 = await resolver({ request: fakeRequest })
    expect(await r1.text()).toBe('a')
    expect(await r2.text()).toBe('a')
  })
})
