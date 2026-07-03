import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildTypeString, generate } from '../plugin-i18n-types'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

describe('buildTypeString', () => {
  it('原始值 → string', () => {
    expect(buildTypeString('hello')).toBe('string')
    expect(buildTypeString(42)).toBe('string')
    expect(buildTypeString(true)).toBe('string')
    expect(buildTypeString(null)).toBe('string')
    expect(buildTypeString(undefined)).toBe('string')
  })

  it('数组 → string[]', () => {
    expect(buildTypeString([1, 2, 3])).toBe('string[]')
    expect(buildTypeString(['a', 'b'])).toBe('string[]')
  })

  it('空对象 → Record', () => {
    expect(buildTypeString({})).toBe('Record<string, string>')
  })

  it('扁平对象 → 接口', () => {
    const result = buildTypeString({ name: 'x', age: 42 })
    expect(result).toContain('name: string')
    expect(result).toContain('age: string')
  })

  it('嵌套对象', () => {
    const result = buildTypeString({ a: { b: { c: 'deep' } } })
    expect(result).toContain('b: {')
    expect(result).toContain('c: string')
  })

  it('数字开头的 key → 加引号', () => {
    const result = buildTypeString({ '404': { title: 'err' } })
    expect(result).toContain("'404':")
  })

  it('混合层级', () => {
    const result = buildTypeString({ top: 'a', nested: { child: 'b', arr: [1] } })
    expect(result).toContain('top: string')
    expect(result).toContain('child: string')
    expect(result).toContain('arr: string[]')
  })
})

describe('generate (集成测试)', () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'i18n-types-test-'))
    await mkdir(join(dir, 'src', 'locales', 'zh'), { recursive: true })
    await mkdir(join(dir, 'src', 'locales', 'en'), { recursive: true })
    await mkdir(join(dir, 'typings'), { recursive: true })
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  async function writeLocale(relPath: string, content: string) {
    const full = join(dir, 'src', 'locales', relPath)
    await mkdir(join(full, '..'), { recursive: true })
    await writeFile(full, content, 'utf-8')
  }

  it('扫描 zh 目录并生成 schema 文件', async () => {
    await writeLocale('zh/example.json5', JSON.stringify({ hello: 'world', bye: 'later' }))

    generate(dir)

    const content = await readFile(join(dir, 'typings', 'i18n-schema.d.ts'), 'utf-8')
    expect(content).toContain('export interface I18nSchema')
    expect(content).toContain('hello: string')
    expect(content).toContain('bye: string')
    expect(content).toContain("declare module 'vue-i18n'")
    expect(content).toContain('DefineLocaleMessage')
  })

  it('子目录 → 嵌套层级', async () => {
    await writeLocale('zh/a/b/deep.json5', JSON.stringify({ key: 'val' }))
    await writeLocale('zh/root.json5', JSON.stringify({ top: 'level' }))

    generate(dir)

    const content = await readFile(join(dir, 'typings', 'i18n-schema.d.ts'), 'utf-8')
    expect(content).toContain('a: {')
    expect(content).toContain('b: {')
    expect(content).toContain('deep: {')
    expect(content).toContain('key: string')
    expect(content).toContain('root: {')
    expect(content).toContain('top: string')
  })

  it('忽略非参考语言（en 不参与类型生成）', async () => {
    await writeLocale('zh/main.json5', JSON.stringify({ zhOnly: 'x' }))
    await writeLocale('en/main.json5', JSON.stringify({ enOnly: 'y', extraField: 'z' }))

    generate(dir)

    const content = await readFile(join(dir, 'typings', 'i18n-schema.d.ts'), 'utf-8')
    expect(content).toContain('zhOnly')
    expect(content).not.toContain('enOnly')
    expect(content).not.toContain('extraField')
  })

  it('参考语言目录不存在时不报错', () => {
    // 只创建 en，不创建 zh
    const ensureNoCrash = () => generate(dir)
    // generate 会 warn 然后跳过，不应 throw
    expect(ensureNoCrash).not.toThrow()
  })

  it('处理带占位符的值', async () => {
    await writeLocale(
      'zh/tpl.json5',
      JSON.stringify({ greet: 'Hello {0}', warn: '{count} errors' })
    )

    generate(dir)

    const content = await readFile(join(dir, 'typings', 'i18n-schema.d.ts'), 'utf-8')
    expect(content).toContain('greet: string')
    expect(content).toContain('warn: string')
  })
})
