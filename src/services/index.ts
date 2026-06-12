import { createRequest } from './instance'

/**
 * 默认请求实例
 *
 * 大多数业务场景直接使用：
 * ```ts
 * import { request } from '@/services'
 *
 * const data = await request.get('users').json()
 * ```
 *
 * 如需创建独立实例（不同 baseUrl/拦截器），使用 createRequest：
 * ```ts
 * const externalApi = createRequest({
 *   prefix: 'https://example.com',
 *   context: { skipAuth: true, skipBusinessCheck: true }
 * })
 * ```
 */
export const request = createRequest()
export default request

// 工厂函数（多实例场景）
export { createRequest } from './instance'

// 自定义业务错误
export { BusinessError, isBusinessError } from './errors'

// 类型导出
export type { KyRequestOptions, RequestContext, ResponseData, NormalizedKyOptions } from './types'

// 重新导出 ky 的错误类型守卫，调用方无需额外 import 'ky'
export { isHTTPError, isTimeoutError, isNetworkError, HTTPError, TimeoutError } from 'ky'
