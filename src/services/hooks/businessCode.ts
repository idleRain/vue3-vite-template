import { getContext, type NormalizedKyOptions, type ResponseData } from '../types'
import { SUCCESS_CODE } from '@/constants/config'
import type { AfterResponseHook } from 'ky'
import { BusinessError } from '../errors'

/**
 * 业务码校验 hook
 *
 * 工作流程：
 * 1. 仅处理 HTTP 2xx 的 JSON 响应（非 2xx 由 ky 抛 HTTPError，非 JSON 透传）
 * 2. 若 context.skipBusinessCheck === true 则透传原响应
 * 3. 比对 data.code 与 successCode（数组用 includes）
 * 4. 命中 → 构造剥离 wrapper 的新 Response，让调用方 .json() 直接拿业务数据
 * 5. 不命中 → 抛 BusinessError，由 beforeError hook 统一处理消息
 */
export const businessCodeHook: AfterResponseHook = async ({ options, response }) => {
  if (!response.ok) return

  const contentType = response.headers.get('content-type')
  if (!contentType?.includes('application/json')) return

  const ctx = getContext(options as NormalizedKyOptions)
  if (ctx.skipBusinessCheck) return

  // 克隆后读取，避免消耗原 body 影响后续 hook 或调用方
  const cloned = response.clone()
  const payload = (await cloned.json()) as ResponseData

  // 响应体不符合 { code, data } 结构时，直接透传
  if (typeof payload !== 'object' || payload === null || typeof payload.code !== 'number') {
    return
  }

  // 解析允许的成功码列表
  const successCodes = normalizeSuccessCodes(ctx.successCode)

  if (successCodes.includes(payload.code)) {
    // 业务成功：剥离 wrapper，返回 data 字段作为新响应体
    const stripped = payload.data ?? payload
    return new Response(JSON.stringify(stripped), {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    })
  }

  // 业务失败：抛出业务错误（消息由 beforeError 处理）
  throw new BusinessError(payload, response)
}

/**
 * 把 successCode 配置规范化为数组
 * 未配置时使用全局 SUCCESS_CODE
 */
const normalizeSuccessCodes = (value: number | number[] | undefined): number[] => {
  if (value === undefined) return [SUCCESS_CODE]
  return Array.isArray(value) ? value : [value]
}
