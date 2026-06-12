import type { Options, NormalizedOptions } from 'ky'

/**
 * 通过 ky 的 context 透传的扩展配置项
 *
 * ky 2.x 提供了 `context` 字段用于在 hook 之间传递自定义数据，
 * 我们把所有项目级扩展选项放在这里，避免侵入 ky 的标准 Options。
 *
 * 使用示例：
 * ```ts
 * request.get('/api/foo', {
 *   context: { showError: false, successCode: 0 }
 * })
 * ```
 */
export interface RequestContext extends Record<string, unknown> {
  /** 是否在出错时弹 toast，默认 true */
  showError?: boolean
  /** 是否对业务码错误弹 toast，默认 true */
  showBusinessError?: boolean
  /** 自定义错误提示（覆盖 hook 生成的默认消息） */
  errorMessage?: string
  /** 跳过 token 自动注入 */
  skipAuth?: boolean
  /** 跳过业务码检查（用于对接第三方 API，响应不带 code/data 包裹） */
  skipBusinessCheck?: boolean
  /** 业务成功码，可为单个数字或数组；不传则使用全局 SUCCESS_CODE */
  successCode?: number | number[]
}

/**
 * 标准 API 响应包裹格式
 * 后端如使用不同字段名，可通过 `skipBusinessCheck` 跳过该规则
 */
export interface ResponseData<T = unknown> {
  code: number
  data: T
  message: string
  success?: boolean
}

/**
 * ky 请求选项的扩展
 * 仍兼容直接传 `showError` 等顶层字段（hook 会同时读 options 顶层和 context）
 */
export interface KyRequestOptions extends Options {
  context?: RequestContext
}

/**
 * 归一化后的扩展选项（hook 内部使用）
 */
export type NormalizedKyOptions = NormalizedOptions & {
  context?: RequestContext
}

/**
 * 从归一化选项中安全取出 context 字段，附带默认值兜底
 */
export const getContext = (options: NormalizedKyOptions): RequestContext => {
  return options.context ?? {}
}
