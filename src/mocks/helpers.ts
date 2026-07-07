import { mockConfig, type MockKey } from './config'
import { bypass } from 'msw'

/**
 * 读取 mockConfig 决定 mock 或透传到真实网络
 *
 * bypass(request) 克隆原请求并附加 msw/passthrough 响应头，
 * MSW 识别此头后放行该请求，交由浏览器执行真实 HTTP 调用
 *
 * @param key - config 中注册的标识，必须与接口一一对应
 * @param mock - mock 响应工厂
 *
 * 使用方式：
 *   http.get('/api/foo', guard('GET /api/foo', () => HttpResponse.json({...})))
 */
export const guard = (key: MockKey, mock: () => Response | Promise<Response>) => {
  return async ({ request }: { request: Request }): Promise<Response> => {
    return mockConfig[key] ? mock() : fetch(bypass(request))
  }
}
