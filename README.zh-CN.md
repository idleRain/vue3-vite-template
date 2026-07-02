# Vue 3 + Vite 8 起步模板

中文文档 | [English Docs →](./README.md)

够多的 Vue 起步模板都在做这些事：塞进你永远不会用的 300KB 图标字体、留着没人要的 Options API、带着谁也解释不清的 PostCSS
配置文件。

这个模板不往这堆里加——它只把每个关键依赖的最新版本挑出来，用真正的工程纪律组装在一起，然后不再挡你的路。

---

## 开箱即有什么

- 暗色模式在 Vue 挂载**之前**就读 localStorage —— 你永远不会看到白屏闪烁
- GSAP 驱动的错误页动画
- 自动导入：Vue、Router、Pinia、i18n 的 API，一行 import 不用写
- 保存即 lint：自研 Vite 插件通过文件监听触发 ESLint，不经浏览器请求
- i18n 类型自动生成：往 `locales/` 加个 JSON5 文件，保存即更新 TypeScript 声明
- `useRequest`：包装任意异步函数，自动管 `data / loading / error`，告别手写样板
- ky 驱动的 HTTP 层 + 可插拔 hook 管道（鉴权、业务码、防缓存、错误 toast），重试 / 超时 / 默认头挂在 ky 实例上
- 生产构建由 `oxc` 压缩，仅 prod 模式剥离 console / debugger
- 中后台数据 UI 已接好：@tanstack/vue-table 表格、vee-validate + zod 表单校验

一句话定位：它是一个基座，不是一个成品。

---

## 为什么选这个，不选其他的模板

| 你在意的       | 典型模板                       | 本项目                                                                                                                        |
| -------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| 构建速度       | Vite 5 / Rollup                | **Vite 8 / Rolldown** — Rust 打包器，dev 冷启以秒计（普通桌面机）                                                             |
| HTTP 客户端    | axios（XHR，gzipped ~12KB）    | **ky**（fetch，gzipped ~4KB）— 体积减半，hook 管道式中间件                                                                    |
| Lint 流程      | `pnpm lint` 是独立一步，经常忘 | **每次保存自动 fix** — 自研 Vite 插件，文件监听直接跑 ESLint，浏览器不参与                                                    |
| i18n 维护      | 手写类型声明                   | **自动生成 schema** — `import.meta.glob` 扫描 `locales/`，构建接口，dev 监听自动更新。加文件即更新类型                        |
| UI 自由度      | 一个库、一种长相               | **shadcn-vue + Element Plus** — shadcn 组件复制到源码（归你所有），Element Plus 扛数据密集型中后台                            |
| 生产产物       | 默认 Terser，慢                | **oxc 压缩器** — Rust 实现，与 Rolldown 共享 AST，据 oxc 团队基准比 Terser 快 30-90 倍。prod 模式自动剥离 console / debugger  |
| 拆包策略       | 框架 + vendor 一锅端           | **精细拆分** — Vue、Router、Pinia、i18n、Element Plus、reka-ui、dayjs 各占独立 chunk。业务共享代码由 `minShareCount` 自动识别 |
| 测试与工程规范 | 没有，或各自为战               | **Vitest + jsdom** + commitlint / husky / lint-staged — 测试能跑，提交守规范                                                  |

---

## 快速开始

```bash
git clone https://github.com/idleRain/vue3-vite-template.git
pnpm install
pnpm dev          # → http://localhost:6789
```

环境要求：Node.js ≥ 22，pnpm ≥ 8。

---

## 设计决策

### HTTP 层：`services/` 管逻辑，`api/` 只声明接口

```
services/
├── instance.ts    # ky 实例，含超时、重试、默认头
├── types.ts       # ResponseData<T>，请求上下文
├── errors.ts      # BusinessError（当 API 返回业务失败时）
└── hooks/
    ├── auth.ts          # Bearer token 注入，401 跳转
    ├── businessCode.ts  # 校验 response.code，剥离 payload 或抛异常
    ├── cacheBuster.ts   # GET 请求防缓存
    └── errorMessage.ts  # 可读错误 toast（vue-sonner）

api/
└── example.ts     # getHello() → request.get('/hello').json()
```

组件永远不接触 HTTP。调用的是 `API.example.getHello()`。`useRequest` 管 loading / error 状态，你不需要自己写
`const loading = ref(true)`。

### i18n：文件结构即类型声明

```
locales/zh/example.json5       →  schema.example
locales/zh/layout.json5       →  schema.layout
locales/zh/a/b/deep.json5     →  schema.a.b.deep
```

`import.meta.glob` 自动发现所有 JSON5 文件。构建运行时消息树的同一套正则，同时生成 `typings/i18n-schema.d.ts`
。新增文件——无需注册、无需手动更新类型。`pnpm i18n:type` 手动扫描，dev 模式下每次保存自动处理。

### 自定义 lint 插件，不是中间件

大多数 Vite ESLint 插件跑在 `transform` hook 里——意味着只有浏览器请求某个文件时才会被 lint。响应慢，容易漏。内置的
`eslint-watch` 插件直接挂在 Vite 的 chokidar 文件监听器上：你保存文件的瞬间，ESLint fix 完直接写回磁盘。浏览器不参与这个流程。

### 拆包策略：缓存在意

下面是 `vite.config.ts` 中 `codeSplitting.groups` 的目标产物示意，实际拆分取决于你引入的依赖——没有专属组的都兜底进
`vendor`。

```
dist/static/js/
├── vue-[hash].js           # Vue 核心
├── vue-router-[hash].js    # 路由
├── pinia-[hash].js         # Pinia
├── vue-i18n-[hash].js      # i18n 运行时
├── element-plus-[hash].js  # Element Plus
├── reka-ui-[hash].js       # shadcn-vue 的无头层
├── lucide-[hash].js        # 图标
├── form-[hash].js          # vee-validate + zod
├── vueuse-[hash].js        # VueUse 工具
├── dayjs-[hash].js         # 日期库
├── ky-[hash].js            # HTTP 客户端
├── sonner-[hash].js        # vue-sonner toast
├── date-[hash].js          # @internationalized/date
├── vendor-[hash].js        # 其余 node_modules
└── common-[hash].js        # 被 ≥2 个 chunk 引用且 >10KB 的业务共享代码
```

每个库独立缓存。升级 Element Plus 不会让 Vue 的缓存失效。`common` chunk 自动识别——任何被至少 2 个异步 chunk 引用且超过
10KB 的模块，自动抽出。无需手工调参。

### 样式：零配置文件

Tailwind CSS 4 通过 `@tailwindcss/vite` 运行。没有 `tailwind.config.js`，没有 `postcss.config.js`。主题 token 全部在
`src/styles/index.css` 的 `@theme inline` 块里定义——所有东西在一个文件中，`oklch` 色彩空间的 CSS 自定义属性。暗色模式只需要一行
`@custom-variant dark`。

---

## 项目架构

```
src/
├── api/            # 接口声明
├── services/       # HTTP 客户端、hooks、类型
├── store/          # Pinia 模块
├── composables/    # useRequest、useClickPosition……
├── components/     # 自动导入组件，含 ui/（shadcn-vue）
├── layouts/        # 侧边栏 + 顶栏壳
├── views/          # 页面及错误页
├── router/         # 路由配置
├── i18n/           # 引擎 + 类型生成
├── locales/        # {lang}/{namespace}.json5
├── styles/         # Tailwind 入口 + 主题变量
├── types/          # 共享接口
├── utils/          # cn()、debounce()、deepClone()、storage、精度运算
└── test/           # 环境 + mock
```

---

## 常用命令

```bash
pnpm dev              # 开发服务器、HMR、保存 lint、i18n 监听
pnpm build            # 生产构建（oxc 压缩 + 剥离 console/debugger）
pnpm build:test       # 测试构建（保留 console）
pnpm build:preview    # 预览构建
pnpm preview          # 本地预览生产构建
pnpm ts               # vue-tsc --noEmit
pnpm lint             # ESLint --fix
pnpm format           # Prettier
pnpm test             # Vitest（全部）
pnpm test:watch       # Vitest（监听）
pnpm test:coverage    # Vitest + 覆盖率
pnpm i18n:type        # 重新生成 i18n 类型声明
```

推荐验证顺序：`pnpm lint` → `pnpm ts` → `pnpm test`

---

## 许可证

[MIT](./LICENSE)
