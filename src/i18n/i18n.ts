import type {
  ImportLocaleFn,
  LoadMessageFn,
  LocaleSetupOptions,
  SupportedLanguagesType
} from './typing'
import { type Locale, createI18n } from 'vue-i18n'
import type { App } from 'vue'

const i18n = createI18n({
  globalInjection: true,
  legacy: false,
  locale: '',
  messages: {}
})

let loadMessages: LoadMessageFn

/**
 * 加载语言模块
 * @param modules
 */
function loadLocalesMap(modules: Record<string, () => Promise<unknown>>) {
  const localesMap: Record<Locale, ImportLocaleFn> = {}

  for (const [path, loadLocale] of Object.entries(modules)) {
    const key = path.match(/([\w-]*)\.(json)/)?.[1]
    if (key) {
      localesMap[key] = loadLocale as ImportLocaleFn
    }
  }
  return localesMap
}

/**
 * 加载具有目录结构的 locale 模块
 * @param regexp - 用于匹配语言和文件名的正则表达式
 * @param modules - 包含路径和导入函数的 modules 对象
 * @returns 区域设置到其相应导入函数的映射
 */
function loadLocalesMapFromDir(
  regexp: RegExp,
  modules: Record<string, () => Promise<unknown>>
): Record<Locale, ImportLocaleFn> {
  const localesRaw: Record<Locale, Record<string, () => Promise<unknown>>> = {}
  const localesMap: Record<Locale, ImportLocaleFn> = {}

  for (const path in modules) {
    const match = path.match(regexp)
    if (match) {
      const [, locale, filePath] = match
      if (locale && filePath) {
        if (!localesRaw[locale]) localesRaw[locale] = {}
        const parts = filePath.split('/')
        const key = parts.join('.')
        localesRaw[locale]![key] = modules[path]!
      }
    }
  }

  for (const [locale, files] of Object.entries(localesRaw)) {
    localesMap[locale] = async () => {
      const messages: Record<string, any> = {}

      for (const [key, importFn] of Object.entries(files)) {
        const keys = key.split('.')
        let current = messages

        for (let i = 0; i < keys.length - 1; i++) {
          const k = keys[i]!
          if (!current[k]) current[k] = {}
          current = current[k]
        }

        const imported = (await importFn()) as { default: any }
        current[keys[keys.length - 1]!] = imported.default
      }

      return { default: messages }
    }
  }

  return localesMap
}

/**
 * 设置语言
 * @param locale
 */
function setI18nLanguage(locale: Locale) {
  i18n.global.locale.value = locale
  document?.querySelector('html')?.setAttribute('lang', locale)
}

/**
 * 加载语言
 * @param lang
 * @param localesMap
 */
async function loadLocaleMessages(
  lang: SupportedLanguagesType,
  localesMap: Record<Locale, ImportLocaleFn>
) {
  if (unref(i18n.global.locale) === lang) {
    return setI18nLanguage(lang)
  }

  const message = await localesMap[lang]?.()
  if (message?.default) {
    i18n.global.setLocaleMessage(lang, message.default as any)
  }

  const mergeMessage = await loadMessages(lang)
  if (mergeMessage) {
    i18n.global.mergeLocaleMessage(lang, mergeMessage)
  }

  return setI18nLanguage(lang)
}

/**
 * 设置 i18n 实例
 * @param app Vue 应用实例
 * @param options 配置选项
 */
async function setupI18n(app: App, options: LocaleSetupOptions = {}) {
  loadMessages = options.loadMessages || (async () => ({}))

  app.use(i18n)

  i18n.global.setMissingHandler((locale, key) => {
    if (options.missingWarn && key.includes('.')) {
      console.warn(`[intlify] Not found '${key}' key in '${locale}' locale messages.`)
    }
  })

  return {
    i18n,
    loadLocaleMessages: (
      lang: SupportedLanguagesType,
      localesMap: Record<Locale, ImportLocaleFn>
    ) => loadLocaleMessages(lang, localesMap)
  }
}

export { i18n, loadLocaleMessages, loadLocalesMap, loadLocalesMapFromDir, setupI18n }
