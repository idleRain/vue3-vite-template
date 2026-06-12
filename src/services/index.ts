import ky, {
  type BeforeRequestHook,
  type AfterResponseHook,
  type KyInstance,
  type NormalizedOptions
} from 'ky'
import type { KyRequestOptions, ResponseData, KyError } from './types'
import { REQUEST_TIMEOUT, RETRY_COUNT } from '@/constants/config'
import { local } from '@/utils/storage.ts'
import { toast } from 'vue-sonner'

// 请求拦截器
const requestInterceptor: BeforeRequestHook = ({ request, options }) => {
  // 添加 token 到请求头
  const token = local.get('token')
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`)
  }

  // 设置默认 Content-Type
  if (!request.headers.get('Content-Type')) {
    request.headers.set('Content-Type', 'application/json')
  }

  // GET 请求添加时间戳防止缓存
  if (options.method === 'get' || !options.method) {
    const url = new URL(request.url)
    url.searchParams.set('_t', Date.now().toString())
    return new Request(url.toString(), request)
  }

  return request
}

// 响应拦截器
const responseInterceptor: AfterResponseHook = async ({ options, response }) => {
  // 将 options 断言为我们的扩展类型
  const customOptions = options as NormalizedOptions & KyRequestOptions

  try {
    // 处理成功响应
    if (response.ok) {
      const contentType = response.headers.get('content-type')

      // 如果是 JSON 响应
      if (contentType?.includes('application/json')) {
        const data = (await response.json()) as ResponseData

        // 处理业务逻辑错误
        if (data.code !== undefined && data.code !== 0) {
          const errorMessage = customOptions.errorMessage || data.message || '请求失败'

          if (customOptions.showError !== false) {
            toast.error(errorMessage)
          }

          const error = new Error(errorMessage) as KyError
          error.status = response.status
          error.data = data
          error.response = response
          throw error
        }

        // 返回业务数据
        return data.data !== undefined ? data.data : data
      }

      // 非 JSON 响应直接返回
      return response
    }

    throw response
  } catch (error) {
    if (error instanceof Response) {
      await handleErrorResponse(error, customOptions)
    }
    throw error
  }
}

// 处理错误响应
const handleErrorResponse = async (
  response: Response,
  options: NormalizedOptions & KyRequestOptions
) => {
  let errorMessage = options.errorMessage || '网络请求失败'
  let errorData: any = null

  try {
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      errorData = await response.json()
      errorMessage = errorData.message || errorMessage
    }
  } catch {
    // JSON 解析失败，使用默认错误消息
  }

  // 根据状态码设置错误消息（如果没有自定义错误消息）
  if (!options.errorMessage) {
    switch (response.status) {
      case 400:
        errorMessage = '请求参数错误'
        break
      case 401:
        errorMessage = '未授权，请重新登录'
        // 清除本地 token 并跳转到登录页
        local.rm('token')
        window.location.href = '/login'
        break
      case 403:
        errorMessage = '拒绝访问'
        break
      case 404:
        errorMessage = '请求的资源不存在'
        break
      case 500:
        errorMessage = '服务器内部错误'
        break
      default:
        errorMessage = `请求失败 (${response.status})`
    }
  }

  // 显示错误提示
  if (options.showError !== false) {
    toast.error(errorMessage)
  }

  const error = new Error(errorMessage) as KyError
  error.status = response.status
  error.data = errorData
  error.response = response

  console.error('请求错误:', error)
  throw error
}

// 创建并配置Ky实例
const request: KyInstance = ky.create({
  prefix: import.meta.env.VITE_BASE_URL ?? '/api',
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  },
  // 请求失败后重试配置
  retry: {
    limit: RETRY_COUNT,
    methods: ['get', 'put', 'head', 'delete', 'options', 'trace'],
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
    delay: attemptCount => 0.3 * 2 ** (attemptCount - 1) * 1000 // 指数退避
  },
  hooks: {
    beforeRequest: [requestInterceptor],
    afterResponse: [responseInterceptor]
  }
})

// 导出Ky实例
export { request }
export default request

// 重新导出类型
export type { KyRequestOptions, ResponseData, KyError } from './types'
