<script setup lang="ts" generic="T extends ZodRawShape">
import type { ZodObject, ZodRawShape, ZodType } from 'zod'
import type { Config, ConfigItem, Shape } from './interface'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { FormItem } from '@/components/ui/form'
import { FieldContextKey, useField } from 'vee-validate'
import { computed, provide } from 'vue'
import AutoFormField from './AutoFormField.vue'
import AutoFormLabel from './AutoFormLabel.vue'
import { beautifyObjectName, getBaseSchema, getBaseType, getDefaultValueInZodStack } from './utils'

const props = defineProps<{
  fieldName: string
  required?: boolean
  config?: Config<T>
  schema?: ZodObject<T>
  disabled?: boolean
}>()

const shapes = computed(() => {
  // @ts-expect-error ignore {} not assignable to object
  const val: { [key in keyof T]: Shape } = {}

  if (!props.schema)
    return
  const shape = (getBaseSchema(props.schema) as any)?.shape as Record<string, ZodType> | undefined
  if (!shape)
    return
  Object.keys(shape).forEach((name) => {
    const item = shape[name] as ZodType
    const baseItem = getBaseSchema(item)
    const baseDef = (baseItem as any)?._def
    // v4 enum 用 entries 对象，v3 用 values 数组
    let options = baseDef
      ? ('values' in baseDef ? baseDef.values as string[]
        : 'entries' in baseDef ? Object.values(baseDef.entries) as string[]
          : undefined)
      : undefined
    if (!Array.isArray(options) && typeof options === 'object')
      options = Object.values(options as object)

    // v4 _def.type 字符串判断 optional / nullable
    const itemDef = (item as any)._def
    const itemType = itemDef?.typeName ?? (itemDef?.type ? `Zod${itemDef.type.charAt(0).toUpperCase()}${itemDef.type.slice(1)}` : '')

    val[name as keyof T] = {
      type: getBaseType(item),
      default: getDefaultValueInZodStack(item),
      options,
      required: !['ZodOptional', 'ZodNullable'].includes(itemType),
      schema: item as any,
    }
  })
  return val
})

const fieldContext = useField(props.fieldName)
// @ts-expect-error ignore missing `id`
provide(FieldContextKey, fieldContext)
</script>

<template>
  <section>
    <slot v-bind="props">
      <Accordion type="single" as-child class="w-full" collapsible :disabled="disabled">
        <FormItem>
          <AccordionItem :value="fieldName" class="border-none">
            <AccordionTrigger>
              <AutoFormLabel class="text-base" :required="required">
                {{ schema?.description || beautifyObjectName(fieldName) }}
              </AutoFormLabel>
            </AccordionTrigger>
            <AccordionContent class="p-1 space-y-5">
              <template v-for="(shape, key) in shapes" :key="key">
                <AutoFormField
                  :config="config?.[key as keyof typeof config] as ConfigItem"
                  :field-name="`${fieldName}.${key.toString()}`"
                  :label="key.toString()"
                  :shape="(shape as Shape)"
                />
              </template>
            </AccordionContent>
          </AccordionItem>
        </FormItem>
      </Accordion>
    </slot>
  </section>
</template>
