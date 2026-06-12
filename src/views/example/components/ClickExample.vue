<script setup lang="ts">
import { useClickPosition } from '@/composables'
import { toast } from 'vue-sonner'

defineOptions({ name: 'ClickExample' })

const { t } = useI18n()
const containerRef = useTemplateRef('containerRef')
const dotPosition = reactive({
  x: -50,
  y: -50
})

const { setOnClick } = useClickPosition(containerRef, { immediate: true })

setOnClick(position => {
  dotPosition.x = position.offsetX
  dotPosition.y = position.offsetY
  toast.message(t('example.clickPosition'), {
    description: `X: ${position.offsetX} Y: ${position.offsetY}`,
    position: 'top-center'
  })
})

const dotStyles = computed(() => ({
  left: `${dotPosition.x}px`,
  top: `${dotPosition.y}px`
}))
</script>

<template>
  <div ref="containerRef" class="relative h-full w-full cursor-pointer">
    <div
      :style="dotStyles"
      class="absolute z-10 h-[16px] w-[16px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#41b883]"
    />
    <div
      class="pointer-events-none absolute inset-0 flex items-center justify-center text-22 text-999"
    >
      {{ t('example.clickAreaTest') }}
    </div>
  </div>
</template>
