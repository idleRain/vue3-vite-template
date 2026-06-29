<script setup lang="ts">
import ErrorPage from './components/ErrorPage.vue'
import { ShieldOff } from '@lucide/vue'

defineOptions({ name: 'Page401' })

const { t } = useI18n()
</script>

<template>
  <ErrorPage
    :title="t('error.401.title')"
    :description="t('error.401.description')"
    :icon="ShieldOff"
    code="401"
    icon-class="text-amber-500"
    bg-type="401"
  />
</template>
