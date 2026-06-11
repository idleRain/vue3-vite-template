<script setup lang="ts">
import { elementLocale } from '@/i18n'
import { Toaster } from 'vue-sonner'

defineOptions({ name: 'App' })
</script>

<template>
  <ElConfigProvider :locale="elementLocale">
    <RouterView />

    <Toaster />
  </ElConfigProvider>
</template>
