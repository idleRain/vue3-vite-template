import type { ResponseData } from './types'

/**
 * 业务码错误
 *
 * 当后端返回 200 OK 但 data.code 不等于约定的成功码时抛出
 * 用于区分"HTTP 错误"（HTTPError）和"业务错误"两种失败情况
 */
export class BusinessError extends Error {
  /** 业务错误码 */
  readonly code: number
  /** 原始响应数据 */
  readonly data: ResponseData
  /** 原始 Response 对象 */
  readonly response: Response

  constructor(data: ResponseData, response: Response) {
    super(data.message || `业务请求失败 (code: ${data.code})`)
    this.name = 'BusinessError'
    this.code = data.code
    this.data = data
    this.response = response
  }
}

/**
 * BusinessError 类型守卫
 *
 * 调用方可直接做窄化判断：
 * ```ts
 * try {
 *   await API.foo()
 * } catch (e) {
 *   if (isBusinessError(e)) {
 *     console.log(e.code, e.data) // 类型安全
 *   }
 * }
 * ```
 */
export const isBusinessError = (error: unknown): error is BusinessError => {
  return error instanceof BusinessError
}
