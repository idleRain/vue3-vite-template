/**
 * vite/plugin-eslint-watch 集成测试
 *
 * 目标：在临时目录里用一份最小 flat config 真跑 ESLint，
 * 验证插件能否把变更文件 fix 并写回磁盘。
 */
import { createMatcher, eslintWatch, lintOne } from '../plugin-eslint-watch'
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { ESLint } from 'eslint'

describe('createMatcher', () => {
  const match = createMatcher()

  it('匹配 src 下的 ts / vue / js 文件', () => {
    expect(match('src/main.ts')).toBe(true)
    expect(match('src/views/Home.vue')).toBe(true)
    expect(match('src/utils/foo.js')).toBe(true)
    expect(match('src/a/b/c/deep.ts')).toBe(true)
  })

  it('排除 src/components/ui 下的 shadcn 组件', () => {
    expect(match('src/components/ui/button/Button.vue')).toBe(false)
    expect(match('src/components/ui/input/Input.vue')).toBe(false)
  })

  it('排除 typings 目录下的声明文件', () => {
    expect(match('typings/auto-imports.d.ts')).toBe(false)
    expect(match('typings/components.d.ts')).toBe(false)
  })

  it('排除 dist 与 node_modules', () => {
    expect(match('dist/static/js/index.js')).toBe(false)
    expect(match('node_modules/some-pkg/index.js')).toBe(false)
  })

  it('不匹配 src 之外的文件', () => {
    expect(match('vite.config.ts')).toBe(false)
    expect(match('package.json')).toBe(false)
    expect(match('docs/readme.md')).toBe(false)
  })

  it('自定义 include / exclude 生效', () => {
    const m = createMatcher(['lib/**/*.ts'], ['lib/legacy/**'])
    expect(m('lib/index.ts')).toBe(true)
    expect(m('lib/legacy/old.ts')).toBe(false)
    expect(m('src/main.ts')).toBe(false)
  })
})

describe('lintOne (集成测试)', () => {
  let tmp: string
  let eslint: ESLint
  const alwaysMatch = () => true

  beforeEach(async () => {
    // 1. 建临时目录
    tmp = await mkdtemp(join(tmpdir(), 'eslint-watch-test-'))
    await mkdir(join(tmp, 'src'), { recursive: true })

    // 2. 在临时目录写一份最小 flat config（纯内置规则，不依赖任何 npm 包）
    //    选用的全是 ESLint 内置 fixable 规则：semi / quotes / indent / no-multi-spaces / no-trailing-spaces
    const flatConfig = `export default [
  {
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    rules: {
      semi: ['error', 'never'],
      quotes: ['error', 'single'],
      indent: ['error', 2],
      'no-multi-spaces': 'error',
      'no-trailing-spaces': 'error'
    }
  }
]
`
    await writeFile(join(tmp, 'eslint.config.js'), flatConfig)
    await writeFile(join(tmp, 'package.json'), JSON.stringify({ type: 'module' }))

    // 3. ESLint 实例 cwd 指向临时目录，会自动读取 eslint.config.js
    eslint = new ESLint({
      fix: true,
      cache: false,
      cwd: tmp,
      errorOnUnmatchedPattern: false
    })
  })

  afterEach(async () => {
    await rm(tmp, { recursive: true, force: true })
  })

  it('fix:true 时把可修复的问题写回磁盘', async () => {
    const file = resolve(tmp, 'src/dirty.js')
    // 故意写满 fixable 的脏写法：分号、双引号、4 空格缩进、多余空格、行尾空格
    const dirty = 'const a = "hello";   \nconsole.log(    a)\n'
    await writeFile(file, dirty)

    const r = await lintOne(eslint, file, tmp, {
      fix: true,
      log: false,
      matches: alwaysMatch
    })

    expect(r.skipped).toBe(false)
    const after = await readFile(file, 'utf-8')
    // 应该被 fix 成单引号、无分号、2 空格、无多余空格
    expect(after).not.toContain('"hello"')
    expect(after).toContain("'hello'")
    expect(after).not.toContain(';')
    expect(after).not.toMatch(/ {2} +/) // 没有多空格
  })

  it('fix:false 时不写回磁盘（即使 ESLint 实例本身处于 fix 模式）', async () => {
    const file = resolve(tmp, 'src/readonly.js')
    const original = 'const a = "x";\n'
    await writeFile(file, original)

    const r = await lintOne(eslint, file, tmp, {
      fix: false, // 不调 outputFixes
      log: false,
      matches: alwaysMatch
    })

    expect(r.skipped).toBe(false)
    const after = await readFile(file, 'utf-8')
    expect(after).toBe(original) // 磁盘内容不变 —— 这是 fix:false 唯一应当保证的
    // 注意：因为 ESLint 实例在 plugin 内部固定 fix:true，messages 会被 fixOutput 吸收，
    // 这里只断言"磁盘不变"，这正是 plugin fix:false 选项的语义边界
  })

  it('fix:true 但传入 fix:false 时，使用独立的 no-fix ESLint 实例能看到原始 error', async () => {
    // 这个用例额外验证：用一个独立 fix:false 的 ESLint 实例，能在 plugin 之外看到 lint 真实报错
    const noFixEslint = new ESLint({ fix: false, cwd: tmp, errorOnUnmatchedPattern: false })
    const file = resolve(tmp, 'src/raw.js')
    const dirty = 'const a = "x";\n'
    await writeFile(file, dirty)

    const r = await lintOne(noFixEslint, file, tmp, {
      fix: false,
      log: false,
      matches: alwaysMatch
    })

    expect(r.skipped).toBe(false)
    expect(r.results?.[0]?.errorCount).toBeGreaterThan(0)
    expect(await readFile(file, 'utf-8')).toBe(dirty)
  })

  it('文件不在 matcher 范围内时跳过，不读不改', async () => {
    const file = resolve(tmp, 'src/should-skip.js')
    const original = 'const a = "x";\n' // 故意有 error
    await writeFile(file, original)

    const r = await lintOne(eslint, file, tmp, {
      fix: true,
      log: false,
      matches: () => false // 永不匹配
    })

    expect(r.skipped).toBe(true)
    const after = await readFile(file, 'utf-8')
    expect(after).toBe(original) // 没被改
  })

  it('代码本就干净时 fix 不做任何改动', async () => {
    const file = resolve(tmp, 'src/clean.js')
    const clean = "const a = 'x'\nconsole.log(a)\n"
    await writeFile(file, clean)

    await lintOne(eslint, file, tmp, {
      fix: true,
      log: false,
      matches: alwaysMatch
    })

    const after = await readFile(file, 'utf-8')
    expect(after).toBe(clean)
  })
})

describe('eslintWatch plugin 形状', () => {
  it('返回一个仅 serve 时启用的 vite plugin', () => {
    const p = eslintWatch()
    expect(p.name).toBe('vite-plugin-eslint-watch')
    expect(p.apply).toBe('serve')
    expect(typeof p.configResolved).toBe('function')
    expect(typeof p.configureServer).toBe('function')
  })

  it('configureServer 给 server.watcher 挂上 change / add 监听', async () => {
    const p = eslintWatch({ log: false })
    // 先跑 configResolved 让 eslint 实例化
    type ConfigResolvedFn = (config: { root: string }) => unknown
    await (p.configResolved as ConfigResolvedFn)({ root: process.cwd() })

    const listeners: Record<string, Array<(f: string) => void>> = {}
    const fakeServer = {
      watcher: {
        on(event: string, cb: (f: string) => void) {
          ;(listeners[event] ||= []).push(cb)
        }
      }
    }
    type ConfigureServerFn = (s: unknown) => unknown
    ;(p.configureServer as ConfigureServerFn)(fakeServer)

    expect(listeners.change?.length).toBe(1)
    expect(listeners.add?.length).toBe(1)
  })
})
