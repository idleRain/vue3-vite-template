/**
 * Rolldown 代码切割分组策略
 *
 * 每个 npm 包独立 chunk，升级单个依赖不会让其他包的缓存失效。
 * common 由 minShareCount + minSize 自动识别业务共享模块。
 */
export const chunkGroups = [
  // 核心框架
  { name: 'vue', test: /node_modules[\\/](@vue[\\/]|vue[\\/])/, priority: 100 },
  { name: 'vue-router', test: /node_modules[\\/]vue-router/, priority: 100 },
  { name: 'pinia', test: /node_modules[\\/]pinia/, priority: 100 },
  { name: 'vue-i18n', test: /node_modules[\\/]@?vue-i18n/, priority: 100 },
  // UI 组件库
  { name: 'element-plus', test: /node_modules[\\/]element-plus/, priority: 90 },
  { name: 'reka-ui', test: /node_modules[\\/]reka-ui/, priority: 90 },
  { name: 'lucide', test: /node_modules[\\/]@?lucide/, priority: 90 },
  // 表单与校验
  { name: 'form', test: /node_modules[\\/](vee-validate|@vee-validate|zod)/, priority: 80 },
  // 工具库
  { name: 'vueuse', test: /node_modules[\\/]@vueuse/, priority: 70 },
  { name: 'dayjs', test: /node_modules[\\/]dayjs/, priority: 70 },
  { name: 'ky', test: /node_modules[\\/]ky/, priority: 70 },
  // 提示与日期相关
  { name: 'sonner', test: /node_modules[\\/]vue-sonner/, priority: 60 },
  { name: 'date', test: /node_modules[\\/]@internationalized[\\/]date/, priority: 60 },
  // 其余 node_modules 兜底
  { name: 'vendor', test: /node_modules/, priority: 10 },
  // 业务侧共享代码：被 ≥2 个入口/异步 chunk 引用且 >10KB
  { name: 'common', minShareCount: 2, minSize: 10000, priority: 5 }
]
