import {
  authRequestHook,
  authResponseHook,
  businessCodeHook,
  cacheBusterHook,
  errorMessageHook
} from './hooks'
import ky, { type KyInstance, type Options, type Hooks } from 'ky'
import { REQUEST_TIMEOUT, RETRY_COUNT } from '@/constants/config'

/**
 * createRequest 选项
 *
 * 除 prefix/timeout/retry 几个高频字段单独提出外，
 * 其余 ky Options 通过 ...overrides 透传
 */
export interface CreateRequestOptions extends Omit<Options, 'hooks'> {
  /** 额外的用户 hooks（会接在内置 hooks 之后执行） */
  hooks?: Hooks
}

/**
 * 创建 ky 实例
 *
 * 默认 hooks 执行顺序（按 ky 串行）：
 * - init:            cacheBusterHook → 用户 init
 * - beforeRequest:   authRequestHook → 用户 beforeRequest
 * - afterResponse:   businessCodeHook → authResponseHook → 用户 afterResponse
 * - beforeError:     errorMessageHook → 用户 beforeError
 */
export const createRequest = (opts: CreateRequestOptions = {}): KyInstance => {
  const { hooks: userHooks, prefix, timeout, retry, headers, ...rest } = opts

  return ky.create({
    prefix: prefix ?? import.meta.env.VITE_BASE_URL ?? '/api',
    timeout: timeout ?? REQUEST_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    retry: retry ?? {
      limit: RETRY_COUNT,
      methods: ['get', 'put', 'head', 'delete', 'options', 'trace'],
      statusCodes: [408, 413, 429, 500, 502, 503, 504],
      delay: attemptCount => 0.3 * 2 ** (attemptCount - 1) * 1000 // 指数退避
    },
    hooks: {
      init: [cacheBusterHook, ...(userHooks?.init ?? [])],
      beforeRequest: [authRequestHook, ...(userHooks?.beforeRequest ?? [])],
      afterResponse: [businessCodeHook, authResponseHook, ...(userHooks?.afterResponse ?? [])],
      beforeError: [errorMessageHook, ...(userHooks?.beforeError ?? [])],
      beforeRetry: userHooks?.beforeRetry ?? []
    },
    ...rest
  })
}
