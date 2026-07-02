import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { normalizePath } from 'vite'
import type { Plugin } from 'vite'
import JSON5 from 'json5'

const LOCALES_DIR = 'src/locales'
const OUTPUT_FILE = 'typings/i18n-schema.d.ts'
const REFERENCE_LOCALE = 'zh'

function isValidKey(name: string): boolean {
  return /^[a-zA-Z_$][\w$]*$/.test(name)
}

function propKey(key: string): string {
  return isValidKey(key) ? key : `'${key}'`
}

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

export function i18nTypesPlugin(): Plugin {
  let root = ''
  let timer: ReturnType<typeof setTimeout> | null = null

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
