<script setup lang="ts">
import ErrorPage from './components/ErrorPage.vue'
import { ServerCrash } from '@lucide/vue'

defineOptions({ name: 'Page500' })

const { t } = useI18n()
</script>

<template>
  <ErrorPage
    :title="t('error.500.title')"
    :description="t('error.500.description')"
    :icon="ServerCrash"
    code="500"
    icon-class="text-destructive"
    bg-type="500"
  />
</template>
