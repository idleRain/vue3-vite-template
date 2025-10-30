/// <reference types="vitest/config" />
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default defineConfig(configEnv => {
  // 获取 vite 配置
  const baseConfig = typeof viteConfig === 'function' ? viteConfig(configEnv) : viteConfig

  return mergeConfig(baseConfig, {
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      typecheck: {
        include: ['src/**/*.{ts,vue}', 'src/test/globals.d.ts']
      },
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'src/test/',
          '**/*.d.ts',
          '**/*.config.*',
          '**/vite.config.*',
          '**/vitest.config.*',
          '**/dist/**',
          '**/build/**',
          '**/.{idea,git,cache,output,temp}/**',
          '**/coverage/**'
        ],
        include: ['src/**/*.{ts,vue}']
      }
    }
  })
})
