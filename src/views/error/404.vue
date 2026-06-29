<script setup lang="ts">
import ErrorPage from './components/ErrorPage.vue'
import { Rocket } from '@lucide/vue'

defineOptions({ name: 'Page404' })

const { t } = useI18n()
</script>

<template>
  <ErrorPage
    :title="t('error.404.title')"
    :description="t('error.404.description')"
    :icon="Rocket"
    code="404"
    icon-class="text-primary"
    bg-type="404"
  />
</template>
