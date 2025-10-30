import type { Options } from 'ky'

/**
 * 扩展的 Ky 请求配置
 */
export interface KyRequestOptions extends Options {
  // 是否显示加载状态
  loading?: boolean
  // 是否显示错误提示
  showError?: boolean
  // 自定义错误消息
  errorMessage?: string
}

/**
 * 标准 API 响应格式
 */
export interface ResponseData<T = any> {
  code: number
  data: T
  message: string
  success: boolean
}

/**
 * Ky 错误接口
 */
export interface KyError extends Error {
  status: number
  data: any
  response: Response
}
