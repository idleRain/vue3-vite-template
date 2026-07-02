/**
 * 手动一键扫描 locales 目录生成 i18n 类型声明
 *
 * 用法: node --experimental-strip-types scripts/gen-i18n-types.ts
 */
import { generate } from '../plugins/plugin-i18n-types'

generate()
