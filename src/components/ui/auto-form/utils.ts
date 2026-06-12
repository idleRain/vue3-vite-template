import type { z } from 'zod'

// zod v4 中 ZodEffects 已被移除，.transform() 返回 ZodPipe<in, out>
// 这里使用 ZodPipe 包裹 ZodObject 来表达"对象 schema 或带 transform 的对象 schema"
export type ZodObjectOrWrapped =
  | z.ZodObject<any, any>
  | z.ZodPipe<z.ZodObject<any, any>, any>

/**
 * Beautify a camelCase string.
 * e.g. "myString" -> "My String"
 */
export function beautifyObjectName(string: string) {
  // Remove bracketed indices
  // if numbers only return the string
  let output = string.replace(/\[\d+\]/g, '').replace(/([A-Z])/g, ' $1')
  output = output.charAt(0).toUpperCase() + output.slice(1)
  return output
}

/**
 * Parse string and extract the index
 * @param string
 * @returns index or undefined
 */
export function getIndexIfArray(string: string) {
  const indexRegex = /\[(\d+)\]/
  // Match the index
  const match = string.match(indexRegex)
  // Extract the index (number)
  const index = match?.[1] !== undefined ? Number.parseInt(match[1]) : undefined
  return index
}

/**
 * Get the lowest level Zod type.
 * This will unpack optionals, refinements, etc.
 *
 * zod v4 变化：
 * - 原 ZodEffects 包装移除，.transform() 返回 ZodPipe，需通过 _def.in 取输入侧 schema
 * - innerType 字段（ZodOptional / ZodDefault 等的内部 schema）保持不变
 */
export function getBaseSchema<
  ChildType extends z.ZodType = z.ZodType,
>(schema: ChildType | z.ZodPipe<ChildType, any>): ChildType | null {
  if (!schema)
    return null
  const def = (schema as any)._def
  if (def && 'innerType' in def)
    return getBaseSchema(def.innerType as ChildType)

  // zod v4：ZodPipe 用 in/out 替代 v3 ZodEffects 的 schema 字段
  if (def && 'in' in def)
    return getBaseSchema(def.in as ChildType)

  // 向后兼容：v3 ZodEffects._def.schema
  if (def && 'schema' in def)
    return getBaseSchema(def.schema as ChildType)

  return schema as ChildType
}

/**
 * Get the type name of the lowest level Zod type.
 * This will unpack optionals, refinements, etc.
 *
 * zod v4 变化：_def.typeName 字段被移除，改为 _def.type（字符串字面量），
 * 返回值首字母大写以兼容旧调用方（例如 'object' -> 'ZodObject'）。
 */
export function getBaseType(schema: z.ZodType) {
  const baseSchema = getBaseSchema(schema)
  if (!baseSchema)
    return ''
  const def = (baseSchema as any)._def
  // v3 typeName 优先，v4 fallback 到 type 并拼接 'Zod' 前缀
  if (def?.typeName)
    return def.typeName as string
  if (def?.type)
    return `Zod${def.type.charAt(0).toUpperCase()}${def.type.slice(1)}`
  return ''
}

/**
 * Search for a "ZodDefault" in the Zod stack and return its value.
 *
 * zod v4 变化：
 * - _def.typeName 改为 _def.type，'ZodDefault' 对应 'default'
 * - _def.defaultValue 在 v4 中直接是值（v3 中是返回值的函数），需同时兼容两者
 * - ZodEffects 的 schema 字段在 v4 ZodPipe 中改为 in
 */
export function getDefaultValueInZodStack(schema: z.ZodType): any {
  const def = (schema as any)._def
  if (!def)
    return undefined

  const isDefault = def.typeName === 'ZodDefault' || def.type === 'default'
  if (isDefault) {
    return typeof def.defaultValue === 'function' ? def.defaultValue() : def.defaultValue
  }

  if ('innerType' in def)
    return getDefaultValueInZodStack(def.innerType as z.ZodType)
  if ('in' in def)
    return getDefaultValueInZodStack(def.in as z.ZodType)
  if ('schema' in def)
    return getDefaultValueInZodStack(def.schema as z.ZodType)

  return undefined
}

export function getObjectFormSchema(
  schema: ZodObjectOrWrapped,
): z.ZodObject<any, any> {
  const def = (schema as any)?._def
  // v4: ZodPipe 用 'pipe' 类型并通过 in 取被 transform 的源 schema
  if (def?.type === 'pipe' && 'in' in def)
    return getObjectFormSchema(def.in)
  // v3 兼容：ZodEffects
  if (def?.typeName === 'ZodEffects' && 'schema' in def)
    return getObjectFormSchema(def.schema)
  return schema as z.ZodObject<any, any>
}

function isIndex(value: unknown): value is number {
  return Number(value) >= 0
}
/**
 * Constructs a path with dot paths for arrays to use brackets to be compatible with vee-validate path syntax
 */
export function normalizeFormPath(path: string): string {
  const pathArr = path.split('.')
  if (!pathArr.length)
    return ''

  let fullPath = String(pathArr[0])
  for (let i = 1; i < pathArr.length; i++) {
    if (isIndex(pathArr[i])) {
      fullPath += `[${pathArr[i]}]`
      continue
    }

    fullPath += `.${pathArr[i]}`
  }

  return fullPath
}

type NestedRecord = Record<string, unknown> | { [k: string]: NestedRecord }
/**
 * Checks if the path opted out of nested fields using `[fieldName]` syntax
 */
export function isNotNestedPath(path: string) {
  return /^\[.+\]$/.test(path)
}
function isObject(obj: unknown): obj is Record<string, unknown> {
  return obj !== null && !!obj && typeof obj === 'object' && !Array.isArray(obj)
}
function isContainerValue(value: unknown): value is Record<string, unknown> {
  return isObject(value) || Array.isArray(value)
}
function cleanupNonNestedPath(path: string) {
  if (isNotNestedPath(path))
    return path.replace(/\[|\]/g, '')

  return path
}

/**
 * Gets a nested property value from an object
 */
export function getFromPath<TValue = unknown>(object: NestedRecord | undefined, path: string): TValue | undefined
export function getFromPath<TValue = unknown, TFallback = TValue>(
  object: NestedRecord | undefined,
  path: string,
  fallback?: TFallback,
): TValue | TFallback
export function getFromPath<TValue = unknown, TFallback = TValue>(
  object: NestedRecord | undefined,
  path: string,
  fallback?: TFallback,
): TValue | TFallback | undefined {
  if (!object)
    return fallback

  if (isNotNestedPath(path))
    return object[cleanupNonNestedPath(path)] as TValue | undefined

  const resolvedValue = (path || '')
    .split(/\.|\[(\d+)\]/)
    .filter(Boolean)
    .reduce((acc, propKey) => {
      if (isContainerValue(acc) && propKey in acc)
        return acc[propKey]

      return fallback
    }, object as unknown)

  return resolvedValue as TValue | undefined
}

type Booleanish = boolean | 'true' | 'false'

export function booleanishToBoolean(value: Booleanish) {
  switch (value) {
    case 'true':
    case true:
      return true
    case 'false':
    case false:
      return false
  }
}

export function maybeBooleanishToBoolean(value?: Booleanish) {
  return value ? booleanishToBoolean(value) : undefined
}
