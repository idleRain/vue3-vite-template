import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'

describe('example handler', () => {
  it('POST /api/example/hello 返回 { code, data, message } 标准结构', async () => {
    const response = await fetch('/api/example/hello', {
      method: 'POST'
    })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({
      code: 200,
      data: { message: 'Hello from MSW Mock!' },
      message: 'success'
    })
  })

  it('响应头 content-type 为 application/json', async () => {
    const response = await fetch('/api/example/hello', {
      method: 'POST'
    })

    expect(response.headers.get('content-type')).toMatch(/application\/json/)
  })

  it('通过 server.use() 可覆盖已有 handler', async () => {
    server.use(
      http.post('/api/example/hello', () =>
        HttpResponse.json({ code: 200, data: 'overridden', message: 'ok' })
      )
    )

    const response = await fetch('/api/example/hello', {
      method: 'POST'
    })
    const body = await response.json()

    expect(body.data).toBe('overridden')
  })

  it('query 参数不影响 handler 路径匹配', async () => {
    const response = await fetch('/api/example/hello?_t=123456&foo=bar', {
      method: 'POST'
    })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.message).toBe('Hello from MSW Mock!')
  })

  it('多次调用返回一致的 mock 数据', async () => {
    const r1 = await (
      await fetch('/api/example/hello', {
        method: 'POST'
      })
    ).json()
    const r2 = await (
      await fetch('/api/example/hello', {
        method: 'POST'
      })
    ).json()
    const r3 = await (
      await fetch('/api/example/hello', {
        method: 'POST'
      })
    ).json()

    expect(r1).toEqual(r2)
    expect(r2).toEqual(r3)
  })
})
