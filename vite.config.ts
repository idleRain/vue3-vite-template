import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { i18nTypesPlugin } from './plugins/plugin-i18n-types'
import { type ConfigEnv, defineConfig, loadEnv } from 'vite'
import { eslintWatch } from './plugins/plugin-eslint-watch'
import Components from 'unplugin-vue-components/vite'
import { visualizer } from 'rollup-plugin-visualizer'
import AutoImport from 'unplugin-auto-import/vite'
import tailwindcss from '@tailwindcss/vite'
import ViteJson5 from 'vite-plugin-json5'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default ({ mode }: ConfigEnv) => {
  const env = loadEnv(mode, process.cwd())
  const isDev = mode === 'dev'
  const isProd = mode === 'prod'
  const enableEslint = isDev && env.VITE_ENABLE_ESLINT === 'true'
  const analyze = env.VITE_BUNDLE_ANALYZE === 'true' && !isDev

  return defineConfig({
    base: '/',
    plugins: [
      vue(),
      tailwindcss(),
      ViteJson5(),
      i18nTypesPlugin(),
      // 通过 env.VITE_ENABLE_ESLINT 控制开关，如果设置了编辑器自动 fix 可以关闭
      ...(enableEslint
        ? [
            eslintWatch({
              include: ['src/**/*.{ts,tsx,vue,js,jsx,mjs,cjs}'],
              exclude: ['src/components/ui/**', 'typings/**', 'dist/**'],
              fix: true
            })
          ]
        : []),
      AutoImport({
        imports: ['vue', 'vue-router', 'pinia', 'vue-i18n'],
        dts: 'typings/auto-imports.d.ts',
        eslintrc: {
          enabled: true,
          filepath: './.eslintrc-auto-import.js',
          globalsPropValue: true
        },
        resolvers: [ElementPlusResolver()]
      }),
      Components({
        dirs: [resolve(__dirname, 'src/components/**')],
        extensions: ['vue'],
        deep: true,
        dts: 'typings/components.d.ts',
        resolvers: [ElementPlusResolver()]
      }),
      ...(analyze
        ? [
            visualizer({
              open: true,
              gzipSize: true,
              brotliSize: true,
              filename: 'dist/bundle-report.html'
            })
          ]
        : [])
    ],
    server: {
      port: Number(env.VITE_SERVER_PORT),
      host: '0.0.0.0',
      proxy: {
        [<string>env.VITE_BASE_URL]: {
          target: <string>env.VITE_PROXY_URL,
          ws: true,
          changeOrigin: true,
          rewrite: (path: string) => path.replace(new RegExp(`^${env.VITE_BASE_URL}`), '')
        }
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '~': resolve(__dirname, './'),
        $ui: resolve(__dirname, './src/components/ui')
      }
    },
    // 打包构建配置
    build: {
      sourcemap: isDev,
      assetsDir: 'static/js',
      rolldownOptions: {
        output: {
          chunkFileNames: 'static/js/[name]-[hash].js',
          entryFileNames: 'static/js/[name]-[hash].js',
          assetFileNames: 'static/[ext]/[name]-[hash].[ext]',
          codeSplitting: {
            groups: [
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
              {
                name: 'form',
                test: /node_modules[\\/](vee-validate|@vee-validate|zod)/,
                priority: 80
              },
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
          },
          // oxc minifier 压缩选项
          minify: {
            compress: {
              // 生产环境剥离 console 和 debugger
              dropConsole: isProd,
              dropDebugger: isProd
            }
          }
        }
      }
    }
  })
}
