import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { type ConfigEnv, defineConfig, loadEnv } from 'vite'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import tailwindcss from '@tailwindcss/vite'
import ViteJson5 from 'vite-plugin-json5'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default ({ mode }: ConfigEnv) => {
  const env = loadEnv(mode, process.cwd())

  return defineConfig({
    base: '/',
    plugins: [
      vue(),
      tailwindcss(),
      ViteJson5(),
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
      })
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
    css: {
      postcss: './postcss.config.js'
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
      sourcemap: mode === 'dev',
      assetsDir: 'static/js',
      rolldownOptions: {
        output: {
          chunkFileNames: 'static/js/[name]-[hash].js',
          entryFileNames: 'static/js/[name]-[hash].js',
          assetFileNames: 'static/[ext]/[name]-[hash].[ext]',
          // 单独打包的模块
          advancedChunks: {
            groups: [
              { name: 'vue', test: /node_modules\/vue/ },
              { name: 'vue-router', test: /node_modules\/vue-router/ },
              { name: 'pinia', test: /node_modules\/pinia/ },
              { name: 'vue-i18n', test: /node_modules\/vue-i18n/ },
              { name: 'element-plus', test: /node_modules\/element-plus/ }
            ]
          }
        }
      },
      // 打包去掉 console 和 debugger
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      }
    }
  })
}
