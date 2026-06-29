<script setup lang="ts">
import ErrorPage from './components/ErrorPage.vue'
import { ShieldBan } from '@lucide/vue'

defineOptions({ name: 'Page403' })

const { t } = useI18n()
</script>

<template>
  <ErrorPage
    :title="t('error.403.title')"
    :description="t('error.403.description')"
    :icon="ShieldBan"
    code="403"
    icon-class="text-orange-500"
    bg-type="403"
  />
</template>
