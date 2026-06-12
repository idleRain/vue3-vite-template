import { getContext, type NormalizedKyOptions } from '../types'
import type { AfterResponseHook, BeforeRequestHook } from 'ky'
import { local } from '@/utils/storage'

/**
 * 注入 Authorization 请求头
 *
 * 从 localStorage 取 token 注入到请求头
 * 通过 context.skipAuth 可跳过（如登录、第三方接口）
 */
export const authRequestHook: BeforeRequestHook = ({ request, options }) => {
  const ctx = getContext(options as NormalizedKyOptions)
  if (ctx.skipAuth) return

  const token = local.get<string>('token')
  if (token && !request.headers.get('Authorization')) {
    request.headers.set('Authorization', `Bearer ${token}`)
  }
}

/**
 * 401 自动跳登录
 *
 * 监听 401 响应，清 token + 跳转登录页
 * 这是少数需要在 afterResponse 里做的事——必须在错误抛出前生效
 */
export const authResponseHook: AfterResponseHook = ({ response }) => {
  if (response.status === 401) {
    local.rm('token')
    // 防止登录页本身触发跳转造成死循环
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }
}
