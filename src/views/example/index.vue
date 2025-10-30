<script lang="ts" setup>
import ClickExample from '@/views/example/components/ClickExample.vue'
import { toast } from 'vue-sonner'
import API from '@/api'

defineOptions({ name: 'Example' })

const { t } = useI18n()
const sendRequest = async () => {
  try {
    const data = await API.example.getHello()
    console.log(data)
    toast.success('success', {
      description: t('example.sendOk', [JSON.stringify(data)]),
      position: 'top-center'
    })
  } catch (e: any) {
    console.log(e)
    toast.error('fail', {
      description: t('example.sendError', [e.message]),
      position: 'top-center'
    })
  }
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
    <div class="grid auto-rows-min gap-4 md:grid-cols-3">
      <div class="flex items-center justify-center rounded-xl bg-muted/50">
        <Button @click="sendRequest">{{ t('example.send') }}</Button>
      </div>
      <div class="aspect-video rounded-xl bg-muted/50">
        <ElDescriptions :title="t('layout.playground')" />
      </div>
      <div class="aspect-video overflow-hidden rounded-xl bg-muted/50">
        <ClickExample />
      </div>
      <div class="min-h-screen flex-1 rounded-xl bg-muted/50 md:min-h-min" />
    </div>
  </div>
</template>
