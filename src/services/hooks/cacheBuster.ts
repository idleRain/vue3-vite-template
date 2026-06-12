import type { InitHook } from 'ky'

/**
 * GET 请求防缓存 hook
 *
 * 利用 ky 的 `init` hook（同步、在请求构造前修改 options），
 * 给 GET 请求追加时间戳参数，避免浏览器/CDN 缓存。
 *
 * 相比在 beforeRequest 里 new Request(url) 重建整个请求对象，
 * init hook 只需操作 options，更轻量。
 */
export const cacheBusterHook: InitHook = options => {
  const method = (options.method ?? 'get').toLowerCase()
  if (method === 'get') {
    const ts = Date.now().toString()
    if (options.searchParams instanceof URLSearchParams) {
      options.searchParams.set('_t', ts)
    } else if (typeof options.searchParams === 'object' && options.searchParams !== null) {
      ;(options.searchParams as Record<string, string>)._t = ts
    } else {
      options.searchParams = { _t: ts }
    }
  }
}
