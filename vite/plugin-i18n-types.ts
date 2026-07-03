import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { normalizePath } from 'vite'
import type { Plugin } from 'vite'
import JSON5 from 'json5'

/**
 * 扫描 locales/ 目录生成 typings/i18n-schema.d.ts，同步扩展 vue-i18n 的 DefineLocaleMessage。
 * 路径约定与运行时 loadLocalesMapFromDir 一致：locales/{lang}/a/b/c.json5 → a.b.c 嵌套结构。
 */

const LOCALES_DIR = 'src/locales'
const OUTPUT_FILE = 'typings/i18n-schema.d.ts'
const REFERENCE_LOCALE = 'zh'

/** 合法标识符不加引号，否则加单引号 */
function isValidKey(name: string): boolean {
  return /^[a-zA-Z_$][\w$]*$/.test(name)
}

function propKey(key: string): string {
  return isValidKey(key) ? key : `'${key}'`
}

/** 递归生成 TS interface 字符串 */
export function buildTypeString(obj: unknown, indent = 2): string {
  if (obj === null || obj === undefined) return 'string'
  if (typeof obj === 'number' || typeof obj === 'boolean') return 'string'
  if (Array.isArray(obj)) return 'string[]'
  if (typeof obj !== 'object') return 'string'

  const record = obj as Record<string, unknown>
  const spaces = ' '.repeat(indent)
  const entries = Object.entries(record).map(([key, value]) => {
    return `${spaces}${propKey(key)}: ${buildTypeString(value, indent + 2)}`
  })
  if (entries.length === 0) return 'Record<string, string>'
  return `{\n${entries.join('\n')}\n${' '.repeat(indent - 2)}}`
}

/**
 * 递归扫描目录，按文件路径构建嵌套对象。
 * locales/zh/a/b/example.json5 → { a: { b: { example: content } } }
 */
function walk(baseDir: string, currentDir: string, result: Record<string, unknown>): void {
  const entries = readdirSync(currentDir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(currentDir, entry.name)
    if (entry.isDirectory()) {
      walk(baseDir, fullPath, result)
    } else if (entry.name.endsWith('.json5') || entry.name.endsWith('.json')) {
      const relPath = relative(baseDir, fullPath).replace(/\\/g, '/')
      const parts = relPath.replace(/\.json5?$/, '').split('/')

      let content: unknown
      try {
        content = JSON5.parse(readFileSync(fullPath, 'utf-8'))
      } catch {
        console.warn(`[i18n-types] 跳过无法解析的文件: ${relPath}`)
        continue
      }

      let current = result
      for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i]!
        if (!current[key] || typeof current[key] !== 'object') {
          current[key] = {}
        }
        current = current[key] as Record<string, unknown>
      }
      current[parts[parts.length - 1]!] = content
    }
  }
}

/**
 * 加载参考语言（zh）目录，生成 typings/i18n-schema.d.ts。
 */
export function generate(root: string = process.cwd()): void {
  const langDir = join(root, LOCALES_DIR, REFERENCE_LOCALE)
  if (!existsSync(langDir)) {
    console.warn(`[i18n-types] 跳过: 参考语言目录不存在 (${langDir})`)
    return
  }

  const merged: Record<string, unknown> = {}
  walk(langDir, langDir, merged)

  const typeBody = buildTypeString(merged)

  const lines = [
    '/* eslint-disable */',
    '// 自动生成，请勿手动编辑',
    '// 源文件: src/locales/ | 参考语言: zh',
    `// 生成时间: ${new Date().toISOString()}`,
    '',
    'export interface I18nSchema ' + typeBody,
    '',
    "declare module 'vue-i18n' {",
    '  export interface DefineLocaleMessage extends I18nSchema {}',
    '}',
    ''
  ]

  const outDir = join(root, 'typings')
  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(root, OUTPUT_FILE), lines.join('\n'), 'utf-8')
  console.log(`[i18n-types] locale schema generated → ${OUTPUT_FILE}`)
}

/**
 * Vite 插件：configResolved 首扫，configureServer 挂 chokidar 监听。
 * walk / configResolved / schedule 各有一层 try-catch，单点异常不影响其余文件。
 */
export function i18nTypesPlugin(): Plugin {
  let root = ''
  let timer: ReturnType<typeof setTimeout> | null = null

  /** 防抖 200ms */
  function schedule() {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      try {
        generate(root)
      } catch (e) {
        console.error('[i18n-types]', e instanceof Error ? e.message : e)
      }
      timer = null
    }, 200)
  }

  return {
    name: 'vite-plugin-i18n-types',
    apply: 'serve',
    configResolved(config) {
      root = normalizePath(config.root)
      try {
        generate(root)
      } catch (e) {
        console.error('[i18n-types]', e instanceof Error ? e.message : e)
      }
    },
    configureServer(server) {
      /** 仅 LOCALES_DIR 下文件变更触发，排除输出文件自触发 */
      const handle = (file: string) => {
        const rel = normalizePath(resolve(file)).slice(root.length + 1)
        if (!rel.startsWith(LOCALES_DIR)) return
        schedule()
      }

      server.watcher.on('change', handle)
      server.watcher.on('add', handle)
      server.watcher.on('unlink', handle)
    }
  }
}
