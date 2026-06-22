import type { Plugin, ViteDevServer } from 'vite'
import { minimatch } from 'minimatch'
import { normalizePath } from 'vite'
import { resolve } from 'node:path'
import { ESLint } from 'eslint'

export interface EslintWatchOptions {
  /** 监听的 glob，相对 vite root */
  include?: string[]
  /** 排除 glob，相对 vite root */
  exclude?: string[]
  /** 是否启用 fix（默认 true） */
  fix?: boolean
  /** 是否在终端打印日志（默认 true） */
  log?: boolean
}

const DEFAULT_INCLUDE = ['src/**/*.{ts,tsx,vue,js,jsx,mjs,cjs}']
const DEFAULT_EXCLUDE = ['src/components/ui/**', 'typings/**', 'dist/**', 'node_modules/**']

/** 文件相对路径是否需要 lint */
export function createMatcher(
  include: string[] = DEFAULT_INCLUDE,
  exclude: string[] = DEFAULT_EXCLUDE
) {
  return (relPath: string) =>
    include.some(p => minimatch(relPath, p, { dot: true })) &&
    !exclude.some(p => minimatch(relPath, p, { dot: true }))
}

/** 对单个绝对路径执行 lint（fix 视 options.fix 决定） */
export async function lintOne(
  eslint: ESLint,
  absPath: string,
  root: string,
  options: { fix?: boolean; log?: boolean; matches: (rel: string) => boolean }
) {
  const rel = normalizePath(absPath).slice(root.length + 1)
  if (!options.matches(rel)) return { skipped: true as const, rel }

  const results = await eslint.lintFiles([absPath])
  if (options.fix) await ESLint.outputFixes(results)

  const hasErr = results.some(r => r.errorCount > 0)
  const hasWarn = results.some(r => r.warningCount > 0)
  if (options.log && (hasErr || hasWarn)) {
    const formatter = await eslint.loadFormatter('stylish')
    const text = await formatter.format(results)

    console.log(text)
  }
  return { skipped: false as const, rel, results }
}

/**
 * dev 期间监听源码变动 → 调用 ESLint Node API → 自动 fix 写回磁盘
 *
 * 与 vite-plugin-eslint / vite-plugin-eslint2 的区别：
 * - 它们走 vite 的 transform hook，依赖文件被浏览器请求才会触发；
 * - 本插件走 chokidar 文件监听，保存即触发，**不依赖模块图**。
 */
export function eslintWatch(options: EslintWatchOptions = {}): Plugin {
  const { include = DEFAULT_INCLUDE, exclude = DEFAULT_EXCLUDE, fix = true, log = true } = options

  let eslint: ESLint
  let root = ''
  const matches = createMatcher(include, exclude)

  return {
    name: 'vite-plugin-eslint-watch',
    apply: 'serve', // 只在 dev 启用，build 不跑
    configResolved(config) {
      root = normalizePath(config.root)
      eslint = new ESLint({
        fix,
        cache: true,
        cwd: root,
        errorOnUnmatchedPattern: false
      })
    },
    configureServer(server: ViteDevServer) {
      const handle = (file: string) => {
        lintOne(eslint, resolve(file), root, { fix, log, matches }).catch(e => {
          console.error('[eslint-watch] lint failed:', e)
        })
      }
      // 复用 vite 内置的 chokidar watcher
      server.watcher.on('change', handle)
      server.watcher.on('add', handle)
      if (log) {
        console.log('[eslint-watch] watching src for lint --fix on save')
      }
    }
  }
}
