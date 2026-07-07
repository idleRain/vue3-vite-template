# Mock

基于 [MSW (Mock Service Worker)](https://mswjs.io) 的接口 mock 模块，在 fetch 层拦截请求返回本地数据，对上层业务代码完全透明。与项目 ky 实例深度集成：token 注入、业务码剥离、错误 toast 等 hook 正常运行。

## 目录结构

```
mocks/
├── config.ts            # 接口开关，key 与 handler 一一对应
├── helpers.ts           # guard() 等公共工具
├── data/                # mock 响应体，按业务域划分
│   └── example.ts
├── handlers/            # 路由定义，按业务域划分
│   ├── example.ts
│   └── index.ts         # 聚合点
├── browser.ts           # setupWorker（开发模式）
├── server.ts            # setupServer（测试模式）
└── index.ts             # startMock() 统一入口
```

## 启用

1. `.env` 中设置 `VITE_ENABLE_MOCK=true`
2. 重启 `pnpm dev`
3. 控制台出现 `[MSW] Mock 已启用` 即生效

## 开关

`config.ts` 按接口独立控制，刷新即生效（HMR，无论重启）：

```ts
export const mockConfig = {
  'POST /api/example/hello': false, // 后端已就绪，走真实网络
  'POST /api/user': true // 后端未就绪，用 mock
} as const satisfies Record<string, boolean>
```

设为 `false` 的接口由 `guard()` 调用 `bypass(request)` 透传到真实网络。

## 新增 mock 接口

1. 在 `config.ts` 中注册 key：

```ts
export const mockConfig = {
  'GET /api/example/hello': true,
  'POST /api/user': true // ← 新增
} as const satisfies Record<string, boolean>
```

2. 在 `data/` 下定义响应体：

```ts
// data/user.ts
export const createUserResponse = {
  code: 200,
  data: { id: 1, name: '张三' },
  message: 'success'
}
```

3. 在 `handlers/` 下定义路由，引用 data + guard：

```ts
// handlers/user.ts
import { createUserResponse } from '../data/user'
import { http, HttpResponse } from 'msw'
import { guard } from '../helpers'

export const userHandlers = [
  http.post(
    '/api/user',
    guard('POST /api/user', () => HttpResponse.json(createUserResponse))
  )
]
```

> `guard(key, mock)` 的 key 参数类型为 `MockKey`，输入不存在的 key 会**编译报错**。

4. 在 `handlers/index.ts` 中汇聚：

```ts
import { userHandlers } from './user'
export const handlers = [...exampleHandlers, ...userHandlers]
```

## 路径匹配

MSW 匹配完整 pathname（含 ky 实例的 `prefix` `/api`）：

```
API 调用: request.post('/example/hello')
实际 URL: /api/example/hello
Handler:  http.post('/api/example/hello', ...)
```

## 测试

`setup.ts` 在 `beforeAll` 中强制将所有 `mockConfig` 设为 `true`——避免开发时无意关掉的 mock 导致 jsdom 下请求真实网络而失败。测试内如需特定 mock，使用 `server.use()` 覆盖：

```ts
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'

test('覆盖 mock', async () => {
  server.use(
    http.post('/api/example/hello', () =>
      HttpResponse.json({ code: 200, data: 'custom', message: 'ok' })
    )
  )
})
```
