# Vue3 Vite 现代化开发模板

## 📖 项目概述

这是一个基于 **Vue 3** + **Vite** 的现代化企业级前端开发模板，整合了最新的前端技术栈和最佳实践，提供开箱即用的开发体验。

### 🛠 核心技术栈

- **🚀 Vue 3** - 渐进式 JavaScript 框架
- **⚡ Rolldown-Vite** - 下一代前端构建工具
- **🎯 TypeScript** - 严格类型检查，提升代码质量
- **🎨 Tailwind CSS** - 原子化 CSS 框架
- **💅 Shadcn-vue** - 高质量、可定制的 UI 组件库
- **🏪 Pinia** - Vue 3 官方推荐的状态管理
- **🧭 Vue Router** - 官方路由解决方案
- **🌐 Vue I18n** - 国际化解决方案，支持动态语言切换
- **📦 Element Plus** - 企业级 UI 组件库

### ✨ 特色功能

- **🎨 主题系统** - 支持亮色/暗色/系统模式，平滑过渡动画
- **🔄 自动导入** - 组件、API、工具函数自动导入，无需手动引入
- **🌍 国际化** - 完整的 i18n 解决方案，支持 JSON5 配置文件
- **📱 响应式布局** - 基于 Tailwind CSS 的移动端适配
- **🛡️ 类型安全** - 全面的 TypeScript 支持和严格模式
- **🔧 开发工具** - ESLint + Prettier + Husky + CommitLint
- **🧪 测试框架** - Vitest + Vue Test Utils + JSDOM，支持单元测试和覆盖率报告

## 📋 环境要求

- **Node.js** >= 22.0.0
- **pnpm** >= 8.0.0 (推荐) 或 **npm** >= 9.0.0

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/idleRain/vue3-vite-template.git
cd vue3-vite-temp
```

### 2. 安装依赖

```bash
# 使用 pnpm
pnpm install

# 或使用 npm
npm install
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:6789](http://localhost:6789) 开始开发。

### 4. 构建生产版本

```bash
# 生产环境构建
npm run build

# 预览构建结果
npm run preview
```

## 📜 可用脚本

| 命令                    | 说明                     | 环境        |
| ----------------------- | ------------------------ | ----------- |
| `npm run dev`           | 启动开发服务器           | development |
| `npm run build`         | 生产环境构建             | production  |
| `npm run build:test`    | 测试环境构建             | test        |
| `npm run build:preview` | 预览环境构建             | preview     |
| `npm run preview`       | 预览生产构建             | production  |
| `npm run ts`            | TypeScript 类型检查      | -           |
| `npm run lint`          | ESLint 检查和修复        | -           |
| `npm run format`        | Prettier 代码格式化      | -           |
| `npm run test`          | 运行单元测试             | -           |
| `npm run test:ui`       | 运行测试并打开 UI 界面   | -           |
| `npm run test:coverage` | 运行测试并生成覆盖率报告 | -           |
| `npm run test:watch`    | 监听模式运行测试         | -           |

## 📁 项目结构

```
vue3-vite-temp/
├── public/                  # 静态资源目录
├── src/
│   ├── api/                 # API 接口定义
│   ├── assets/              # 资源文件（图片、字体等）
│   ├── components/          # 公共组件
│   │   ├── ui/              # Shadcn-vue UI 组件
│   │   └── System/          # 系统级组件（主题切换等）
│   ├── i18n/                # 国际化配置
│   ├── layouts/             # 布局组件
│   │   └── components/      # 布局相关组件
│   ├── locales/             # 语言包文件
│   │   ├── en/              # 英文语言包
│   │   └── zh/              # 中文语言包
│   ├── router/              # 路由配置
│   ├── services/            # 服务层（HTTP 客户端等）
│   ├── store/               # Pinia 状态管理
│   │   └── modules/         # 状态模块
│   ├── styles/              # 全局样式
│   ├── test/                # 测试配置和工具
│   ├── types/               # TypeScript 类型定义
│   ├── utils/               # 工具函数
│   │   └── __tests__/       # 工具函数测试
│   ├── views/               # 页面组件
│   ├── App.vue              # 根组件
│   └── main.ts              # 应用入口
├── typings/                 # 全局类型声明
├── .env                     # 环境变量
├── components.d.ts          # 组件类型声明
├── tsconfig.json            # TypeScript 配置
├── vite.config.ts           # Vite 配置
└── vitest.config.ts         # Vitest 测试配置
```

## 🎨 主题系统

项目内置了完整的主题切换系统：

- **🌞 亮色模式** - 默认亮色主题
- **🌙 暗色模式** - 深色主题
- **💻 系统模式** - 跟随系统主题设置

## 🧪 测试框架

项目集成了 **Vitest** 作为测试框架，提供完整的单元测试支持：

### 测试特性

- **⚡ 快速执行** - 基于 Vite 的快速测试运行
- **🔧 零配置** - 开箱即用的测试环境
- **📊 覆盖率报告** - 内置代码覆盖率统计
- **🎯 TypeScript 支持** - 完整的 TypeScript 类型检查
- **🌐 JSDOM 环境** - 浏览器 API 模拟
- **🔄 热重载** - 监听模式下的实时测试

### 测试结构

```
src/
├── utils/
│   ├── storage.ts           # 存储工具函数
│   └── __tests__/           # 测试文件目录
│       └── storage.test.ts  # 存储工具测试
├── test/
│   ├── setup.ts             # 测试环境配置
└── vitest.config.ts         # Vitest 配置文件
```

### 测试配置

项目已预配置以下测试环境：

- **🌐 JSDOM** - 浏览器 API 模拟
- **📦 自动导入** - Vue、Pinia、Vue Router 等自动导入
- **🔧 Mock 支持** - localStorage、sessionStorage、fetch 等已预配置
- **📊 覆盖率报告** - 支持 Text、JSON、HTML 多种格式

## 🌍 国际化

项目支持多语言国际化：

### 语言配置

- **中文** - `src/locales/zh/`
- **English** - `src/locales/en/`

### 使用方式

```vue
<template>
  <div>
    <!-- 在模板中使用 -->
    <h1>{{ $t('example.title') }}</h1>

    <!-- 或在 script 中使用 -->
    <p>{{ t('example.description') }}</p>
  </div>
</template>

<script setup>
// 自动导入，无需手动引入
const { t } = useI18n()
</script>
```

### 添加新语言

1. 在 `src/locales/` 下创建新的语言目录
2. 添加对应的 JSON5 配置文件
3. 在 `src/i18n/locales.ts` 中注册新语言

## 🚀 部署指南

### 构建优化

项目已配置多种构建优化：

- **代码分割**: 自动分离第三方库和业务代码
- **Tree Shaking**: 移除未使用的代码
- **资源压缩**: Gzip/Brotli 压缩支持
- **缓存策略**: 文件指纹和长期缓存

### 部署方式

```bash
# 1. 构建项目
npm run build

# 2. 部署 dist/ 目录到服务器
# 支持 Nginx、Apache、CDN 等多种部署方式
```

## 📄 许可证

本项目基于 [MIT License](./LICENSE) 开源协议。

---

**🌟 如果这个项目对你有帮助，请给一个 Star！🌟**
