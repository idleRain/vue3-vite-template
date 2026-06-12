import { getContext, type NormalizedKyOptions } from '../types'
import { isHTTPError, isTimeoutError } from 'ky'
import { isBusinessError } from '../errors'
import type { BeforeErrorHook } from 'ky'
import { toast } from 'vue-sonner'

/**
 * 错误消息生成 + Toast hook
 *
 * 在错误抛给调用方之前，统一：
 * 1. 根据错误类型生成中文友好提示
 * 2. 按 context 配置决定是否 toast
 * 3. 返回原错误（不阻断抛出，调用方仍可 catch 处理）
 *
 * 注意：BusinessError 不是 ky 抛出的，但因为 businessCode hook 在 afterResponse 里 throw，
 * ky 会通过 beforeError 走一遍，所以这里可统一处理
 */
export const errorMessageHook: BeforeErrorHook = ({ error, options }) => {
  const ctx = getContext(options as NormalizedKyOptions)

  // 1. 优先使用调用方自定义的消息
  // 2. 否则按错误类型派生默认消息
  const message = ctx.errorMessage ?? deriveErrorMessage(error)

  // 决定是否弹 toast：
  // - HTTP/网络/超时错误：受 showError 控制（默认 true）
  // - 业务错误：受 showBusinessError 控制（默认 true）
  const shouldShow = isBusinessError(error)
    ? ctx.showBusinessError !== false
    : ctx.showError !== false

  if (shouldShow && message) {
    toast.error(message)
  }

  // 同步错误消息，便于调用方直接读 error.message
  if (message) error.message = message

  return error
}

/**
 * 根据错误类型生成默认消息
 */
const deriveErrorMessage = (error: Error): string => {
  if (isBusinessError(error)) {
    return error.message || `业务请求失败 (code: ${error.code})`
  }

  if (isTimeoutError(error)) {
    return '请求超时，请稍后重试'
  }

  if (isHTTPError(error)) {
    return httpStatusMessage(error.response.status)
  }

  // 网络错误 / 其它未知错误
  return error.message || '网络请求失败'
}

const httpStatusMessage = (status: number): string => {
  switch (status) {
    case 400:
      return '请求参数错误'
    case 401:
      return '未授权，请重新登录'
    case 403:
      return '拒绝访问'
    case 404:
      return '请求的资源不存在'
    case 408:
      return '请求超时'
    case 500:
      return '服务器内部错误'
    case 502:
      return '网关错误'
    case 503:
      return '服务暂不可用'
    case 504:
      return '网关超时'
    default:
      return `请求失败 (${status})`
  }
}
