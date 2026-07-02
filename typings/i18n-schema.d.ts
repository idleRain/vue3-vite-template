/* eslint-disable */
// 自动生成，请勿手动编辑
// 源文件: src/locales/ | 参考语言: zh
// 生成时间: 2026-07-02T05:39:55.807Z

export interface I18nSchema {
  error: {
    '401': {
      title: string
      description: string
    }
    '403': {
      title: string
      description: string
    }
    '404': {
      title: string
      description: string
    }
    '500': {
      title: string
      description: string
    }
    goHome: string
    goBack: string
    contactSupport: string
  }
  example: {
    send: string
    sendOk: string
    sendError: string
    clickAreaTest: string
    clickPosition: string
  }
  layout: {
    playground: string
    languageSwitch: string
    sidebar: {
      teams: {
        acmeInc: string
        acmeCorp: string
        evilCorp: string
      }
      plans: {
        enterprise: string
        startup: string
        free: string
      }
      nav: {
        playground: {
          title: string
          history: string
          starred: string
          settings: string
        }
        models: {
          title: string
          genesis: string
          explorer: string
          quantum: string
        }
        documentation: {
          title: string
          introduction: string
          getStarted: string
          tutorials: string
          changelog: string
        }
        settings: {
          title: string
          general: string
          team: string
          billing: string
          limits: string
        }
      }
      projects: {
        designEngineering: string
        salesMarketing: string
        travel: string
      }
    }
  }
}

declare module 'vue-i18n' {
  export interface DefineLocaleMessage extends I18nSchema {}
}
