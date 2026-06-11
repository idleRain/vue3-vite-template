import eslintPluginPrettier from 'eslint-plugin-prettier/recommended'
import eslintAutoImport from './.eslintrc-auto-import.js'
import { includeIgnoreFile } from 'eslint/config'
import prettier from 'eslint-config-prettier'
import { fileURLToPath } from 'node:url'
import vue from 'eslint-plugin-vue'
import ts from 'typescript-eslint'
import globals from 'globals'
import js from '@eslint/js'

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url))

export default ts.config(
  includeIgnoreFile(gitignorePath, { gitignoreResolution: true }),
  js.configs.recommended,
  ts.configs.recommended,
  eslintPluginPrettier,
  prettier,
  ...vue.configs['flat/essential'],
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node }
    }
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: '@typescript-eslint/parser'
      },
      globals: {
        ...eslintAutoImport.globals
      }
    }
  },
  {
    rules: {
      // 允许使用 any
      '@typescript-eslint/no-explicit-any': 'off',
      // 允许设置未使用的变量
      '@typescript-eslint/no-unused-vars': 'warn',
      // 允许组件名为单个单词
      'vue/multi-word-component-names': 'off',
      // 空标签自闭合
      'vue/html-self-closing': [
        'warn',
        {
          html: {
            void: 'always',
            normal: 'always',
            component: 'always'
          }
        }
      ],
      // 允许使用 this
      '@typescript-eslint/no-this-alias': [
        'error',
        {
          allowedNames: ['that'] // this可用的局部变量名称
        }
      ],
      'vue/no-export-in-script-setup': 'off',
      // 使用大驼峰命名
      'vue/component-definition-name-casing': ['error', 'PascalCase'],
      // 模板中使用也必须用大驼峰
      'vue/component-name-in-template-casing': [
        'error',
        // 'kebab-case', // 分隔命名
        'PascalCase', // 大驼峰
        { registeredComponentsOnly: false, ignores: ['/^kh-/'] }
      ],
      // 允许使用 v-html
      'vue/no-v-html': 'off',
      // 属性小写横线隔开
      'vue/attribute-hyphenation': 'warn',
      // 事件用小写横线隔开
      'vue/v-on-event-hyphenation': 'warn',
      // 是否使用 ts-expect-error
      '@typescript-eslint/ban-ts-comment': 'off',
      'vue/valid-v-html': 'off',
      '@typescript-eslint/triple-slash-reference': 'off'
    }
  },
  {
    ignores: ['./src/components/ui/*', './.eslintrc-auto-import.js']
  }
)
