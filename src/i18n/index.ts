import { i18n, loadLocaleMessages, loadLocalesMapFromDir, setupI18n as coreSetup } from './i18n'
import type { LocaleSetupOptions, SupportedLanguagesType } from './typing'
import defaultLocale from 'element-plus/es/locale/lang/zh-cn'
import type { Language } from 'element-plus/es/locale'
import enLocale from 'element-plus/es/locale/lang/en'
import { local } from '@/utils/storage'
import type { App } from 'vue'
import dayjs from 'dayjs'

const elementLocale = ref<Language>(defaultLocale)
const $t = i18n.global.t

const modules = import.meta.glob(['../locales/**/*.json', '../locales/**/*.json5'])
const localesMap = loadLocalesMapFromDir(
  /^\.\.\/locales\/([^/]+)\/(.*?)(?:\.json5?|\.json)$/,
  modules
)

/**
 * 加载dayjs的语言包
 * @param lang
 */
async function loadDayjsLocale(lang: SupportedLanguagesType) {
  try {
    let locale
    switch (lang) {
      case 'en':
        locale = await import('dayjs/locale/en')
        break
      case 'zh':
        locale = await import('dayjs/locale/zh-cn')
        break
      default:
        locale = await import('dayjs/locale/zh-cn')
    }

    if (locale) {
      dayjs.locale(locale)
    }
  } catch (error: unknown) {
    console.error(`Failed to load dayjs locale for ${lang}:`, error)
  }
}

/**
 * 加载element-plus的语言包
 * @param lang
 */
async function loadElementLocale(lang: SupportedLanguagesType) {
  switch (lang) {
    case 'en':
      elementLocale.value = enLocale
      break
    case 'zh':
      elementLocale.value = defaultLocale
      break
    default:
      elementLocale.value = defaultLocale
  }
}

/**
 * 加载第三方组件库的语言包
 * @param lang
 */
async function loadThirdPartyMessages(lang: SupportedLanguagesType) {
  await Promise.all([loadElementLocale(lang), loadDayjsLocale(lang)])
}

/**
 * 应用级别的语言切换
 * @param lang 目标语言
 */
async function switchLanguage(lang: SupportedLanguagesType) {
  await Promise.all([loadLocaleMessages(lang, localesMap), loadThirdPartyMessages(lang)])
  local.set('lang', lang)
}

/**
 * 设置国际化
 * @param app Vue 应用实例
 * @param options 配置选项
 */
async function setupI18n(app: App, options: LocaleSetupOptions = {}) {
  const defaultLang: SupportedLanguagesType =
    local.get<SupportedLanguagesType>('lang') ?? import.meta.env.VITE_APP_LOCALE ?? 'zh'
  const { loadLocaleMessages: coreLoadMessages } = await coreSetup(app, {
    defaultLocale: defaultLang,
    loadMessages: async (lang: SupportedLanguagesType) => {
      await loadThirdPartyMessages(lang)
      return undefined
    },
    missingWarn: import.meta.env.DEV,
    ...options
  })

  await coreLoadMessages(defaultLang, localesMap)
  await loadThirdPartyMessages(defaultLang)
}

export {
  $t,
  i18n,
  elementLocale,
  setupI18n,
  switchLanguage,
  loadLocaleMessages,
  loadLocalesMapFromDir
}
