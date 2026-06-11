<script setup lang="ts">
import { Languages } from '@lucide/vue'
import { switchLanguage } from '@/i18n'

const { t } = useI18n()
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger>
      <Button size="default" variant="ghost" class="h-9 w-9 cursor-pointer">
        <Languages :size="24" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuLabel>{{ t('layout.languageSwitch') }}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem @click="switchLanguage('zh')">中文</DropdownMenuItem>
      <DropdownMenuItem @click="switchLanguage('en')">English</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<style scoped></style>
