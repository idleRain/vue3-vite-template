<script setup lang="ts" generic="T extends ZodObjectOrWrapped">
import type { FormContext, GenericObject } from 'vee-validate'
import type { z } from 'zod'
import type { Config, ConfigItem, Dependency, Shape } from './interface'
import { Form } from '@/components/ui/form'
import { toTypedSchema } from '@vee-validate/zod'
import { computed, toRefs } from 'vue'
import AutoFormField from './AutoFormField.vue'
import { provideDependencies } from './dependencies'
import { getBaseSchema, getBaseType, getDefaultValueInZodStack, getObjectFormSchema, type ZodObjectOrWrapped } from './utils'

const props = defineProps<{
  schema: T
  form?: FormContext<GenericObject>
  fieldConfig?: Config<z.infer<T>>
  dependencies?: Dependency<z.infer<T>>[]
}>()

const emits = defineEmits<{
  submit: [event: z.infer<T>]
}>()

const { dependencies } = toRefs(props)
// 泛型 Ref 与 provide 期望的 Record<string, unknown> 协变不上，这里强转
provideDependencies(dependencies as any)

// zod v4：用 ZodType 替代已删除的 ZodAny；通过 _def.type 字符串字面量做类型判断
const shapes = computed(() => {
  // @ts-expect-error ignore {} not assignable to object
  const val: { [key in keyof T]: Shape } = {}
  const baseSchema = getObjectFormSchema(props.schema)
  const shape = baseSchema.shape as Record<string, z.ZodType>
  Object.keys(shape).forEach((name) => {
    const item = shape[name] as z.ZodType
    const baseItem = getBaseSchema(item)
    const baseDef = (baseItem as any)?._def
    // v4 中 enum 的可选值放在 entries（对象），v3 中放在 values（数组）
    let options = baseDef
      ? ('values' in baseDef ? baseDef.values as string[]
        : 'entries' in baseDef ? Object.values(baseDef.entries) as string[]
          : undefined)
      : undefined
    if (!Array.isArray(options) && typeof options === 'object')
      options = Object.values(options as object)

    // v4 用 _def.type === 'optional' / 'nullable'，v3 用 _def.typeName === 'ZodOptional'
    const itemDef = (item as any)._def
    const itemType = itemDef?.typeName ?? (itemDef?.type ? `Zod${itemDef.type.charAt(0).toUpperCase()}${itemDef.type.slice(1)}` : '')

    val[name as keyof T] = {
      type: getBaseType(item),
      default: getDefaultValueInZodStack(item),
      options,
      required: !['ZodOptional', 'ZodNullable'].includes(itemType),
      schema: baseItem as any,
    }
  })
  return val
})

const fields = computed(() => {
  // @ts-expect-error ignore {} not assignable to object
  const val: { [key in keyof z.infer<T>]: { shape: Shape, fieldName: string, config: ConfigItem } } = {}
  for (const key in shapes.value) {
    const shape = shapes.value[key]
    val[key as keyof z.infer<T>] = {
      shape,
      config: props.fieldConfig?.[key] as ConfigItem,
      fieldName: key,
    }
  }
  return val
})

const formComponent = computed(() => props.form ? 'form' : Form)
const formComponentProps = computed(() => {
  if (props.form) {
    return {
      onSubmit: props.form.handleSubmit(val => emits('submit', val as z.infer<T>)),
    }
  }
  else {
    const formSchema = toTypedSchema(props.schema as any)
    return {
      keepValues: true,
      validationSchema: formSchema,
      onSubmit: (val: GenericObject) => emits('submit', val as z.infer<T>),
    }
  }
})
</script>

<template>
  <component
    :is="formComponent"
    v-bind="formComponentProps"
  >
    <slot name="customAutoForm" :fields="fields">
      <template v-for="(shape, key) of shapes" :key="key">
        <slot
          :shape="(shape as Shape)"
          :name="key.toString() as keyof z.infer<T>"
          :field-name="key.toString()"
          :config="fieldConfig?.[key as keyof typeof fieldConfig] as ConfigItem"
        >
          <AutoFormField
            :config="fieldConfig?.[key as keyof typeof fieldConfig] as ConfigItem"
            :field-name="key.toString()"
            :shape="(shape as Shape)"
          />
        </slot>
      </template>
    </slot>

    <slot :shapes="shapes" />
  </component>
</template>
