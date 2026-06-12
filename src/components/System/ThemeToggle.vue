<script setup lang="ts">
import { Sun, Moon, Monitor } from '@lucide/vue'
import { useColorMode } from '@vueuse/core'

const mode = useColorMode({
  disableTransition: false
})

const currentTheme = computed(() => {
  if (mode.value === 'auto') return 'system'
  return mode.value
})

const toggleTheme = () => {
  const themeOrder = ['light', 'dark', 'auto'] as const
  const currentIndex = themeOrder.indexOf(mode.value as (typeof themeOrder)[number])
  const nextIndex = (currentIndex + 1) % themeOrder.length
  // 上面用 % 保证 nextIndex 必在范围内，这里安全断言非 undefined
  mode.value = themeOrder[nextIndex]!
}

const getThemeTitle = () => {
  const themeMap = {
    light: '切换到暗色模式',
    dark: '切换到系统模式',
    system: '切换到亮色模式'
  }
  return themeMap[currentTheme.value]
}
</script>

<template>
  <div class="flex items-center">
    <Button
      variant="ghost"
      size="icon"
      :title="getThemeTitle()"
      class="relative h-9 w-9 cursor-pointer overflow-hidden transition-all duration-200 hover:bg-accent/80"
      @click="toggleTheme"
    >
      <div class="relative">
        <Transition name="theme-icon" mode="out-in">
          <Sun
            v-if="currentTheme === 'light'"
            key="light"
            class="h-4 w-4 text-amber-500 transition-all duration-200"
          />
          <Moon
            v-else-if="currentTheme === 'dark'"
            key="dark"
            class="h-4 w-4 text-blue-400 transition-all duration-200"
          />
          <Monitor
            v-else
            key="system"
            class="h-4 w-4 text-slate-600 transition-all duration-200 dark:text-slate-400"
          />
        </Transition>
      </div>
    </Button>
  </div>
</template>

<style scoped>
.theme-icon-enter-active,
.theme-icon-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.theme-icon-enter-from {
  transform: rotate(180deg) scale(0.5);
  opacity: 0;
}

.theme-icon-leave-to {
  transform: rotate(-180deg) scale(0.5);
  opacity: 0;
}

.theme-icon-enter-to,
.theme-icon-leave-from {
  transform: rotate(0deg) scale(1);
  opacity: 1;
}
</style>
