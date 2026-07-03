import { type ConfigEnv, defineConfig, loadEnv } from 'vite'
import { createPlugins } from './vite/plugins'
import { chunkGroups } from './vite/chunks'
import { resolve } from 'node:path'

export default ({ mode }: ConfigEnv) => {
  const env = loadEnv(mode, process.cwd())
  const isDev = mode === 'dev'
  const isProd = mode === 'prod'

  return defineConfig({
    base: '/',

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

    plugins: createPlugins({
      isDev,
      enableEslint: isDev && env.VITE_ENABLE_ESLINT === 'true',
      analyze: env.VITE_BUNDLE_ANALYZE === 'true' && !isDev,
      root: __dirname
    }),

    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '~': resolve(__dirname, './'),
        $ui: resolve(__dirname, './src/components/ui')
      }
    },

    build: {
      sourcemap: isDev,
      assetsDir: 'static/js',
      rolldownOptions: {
        output: {
          chunkFileNames: 'static/js/[name]-[hash].js',
          entryFileNames: 'static/js/[name]-[hash].js',
          assetFileNames: 'static/[ext]/[name]-[hash].[ext]',
          codeSplitting: {
            groups: chunkGroups
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
