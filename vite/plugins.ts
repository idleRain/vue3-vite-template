import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { visualizer } from 'rollup-plugin-visualizer'
import { i18nTypesPlugin } from './plugin-i18n-types'
import { eslintWatch } from './plugin-eslint-watch'
import AutoImport from 'unplugin-auto-import/vite'
import tailwindcss from '@tailwindcss/vite'
import ViteJson5 from 'vite-plugin-json5'
import type { PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

interface Options {
  isDev: boolean
  enableEslint: boolean
  analyze: boolean
  root: string
}

const when = (cond: boolean, p: () => PluginOption): PluginOption[] => (cond ? [p()] : [])

export function createPlugins(options: Options): PluginOption[] {
  return [
    vue(),
    tailwindcss(),
    ViteJson5(),

    when(options.enableEslint, () =>
      eslintWatch({
        include: ['src/**/*.{ts,tsx,vue,js,jsx,mjs,cjs}'],
        exclude: ['src/components/ui/**', 'typings/**', 'dist/**'],
        fix: true
      })
    ),
    when(options.isDev, () => i18nTypesPlugin()),

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
      dirs: [resolve(options.root, 'src/components/**')],
      extensions: ['vue'],
      deep: true,
      dts: 'typings/components.d.ts',
      resolvers: [ElementPlusResolver()]
    }),

    when(options.analyze, () =>
      visualizer({
        open: true,
        gzipSize: true,
        brotliSize: true,
        filename: 'dist/bundle-report.html'
      })
    )
  ]
}
