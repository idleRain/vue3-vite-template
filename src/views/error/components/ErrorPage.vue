<script setup lang="ts">
import ErrorBackground from './ErrorBackground.vue'
import gsap from 'gsap'

defineProps<{
  code: string
  title: string
  description: string
  icon: any
  iconClass?: string
  bgType: '404' | '500' | '401' | '403'
}>()

const { t } = useI18n()
const router = useRouter()

const iconEl = useTemplateRef<HTMLElement>('iconEl')
const codeEl = useTemplateRef<HTMLElement>('codeEl')
const titleEl = useTemplateRef<HTMLElement>('titleEl')
const descEl = useTemplateRef<HTMLElement>('descEl')
const btnGroupEl = useTemplateRef<HTMLElement>('btnGroupEl')
const footerEl = useTemplateRef<HTMLElement>('footerEl')

onMounted(() => {
  if (!iconEl.value) return

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

  tl.from(iconEl.value, {
    scale: 0,
    rotation: -15,
    opacity: 0,
    duration: 0.7,
    ease: 'back.out(1.7)'
  })

  if (codeEl.value) {
    tl.from(codeEl.value, { y: 40, opacity: 0, duration: 0.6 }, '-=0.3')
  }
  if (titleEl.value) {
    tl.from(titleEl.value, { y: 20, opacity: 0, duration: 0.5 }, '-=0.3')
  }
  if (descEl.value) {
    tl.from(descEl.value, { y: 15, opacity: 0, duration: 0.5 }, '-=0.25')
  }
  if (btnGroupEl.value) {
    tl.from(btnGroupEl.value, { y: 20, opacity: 0, duration: 0.5 }, '-=0.2')
  }
  if (footerEl.value) {
    tl.from(footerEl.value, { opacity: 0, duration: 0.4 }, '-=0.1')
  }
})

function goHome() {
  router.push('/')
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    goHome()
  }
}
</script>

<template>
  <div
    class="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 text-center"
  >
    <ErrorBackground :type="bgType" />

    <div class="relative z-10 flex flex-col items-center">
      <!-- 图标 -->
      <div
        ref="iconEl"
        class="mb-8 flex h-24 w-24 items-center justify-center rounded-2xl border border-border bg-card/80 shadow-lg backdrop-blur-sm"
      >
        <component :is="icon" :class="['h-12 w-12 text-muted-foreground', iconClass]" />
      </div>

      <!-- 错误码 -->
      <h1
        ref="codeEl"
        class="mb-3 font-mono text-8xl font-bold tracking-tighter text-foreground/90 sm:text-9xl"
      >
        {{ code }}
      </h1>

      <!-- 标题 -->
      <h2 ref="titleEl" class="mb-3 text-2xl font-semibold text-foreground sm:text-3xl">
        {{ title }}
      </h2>

      <!-- 描述 -->
      <p ref="descEl" class="mb-10 max-w-md text-base text-muted-foreground sm:text-lg">
        {{ description }}
      </p>

      <!-- 操作按钮 -->
      <div ref="btnGroupEl" class="flex flex-wrap items-center justify-center gap-4">
        <button
          class="group inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground shadow-md transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
          @click="goHome"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="transition-transform duration-200 group-hover:-translate-y-0.5"
          >
            <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
            <path
              d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
            />
          </svg>
          {{ t('error.goHome') }}
        </button>
        <button
          class="group inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-card/80 px-6 text-sm font-medium text-foreground shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-accent hover:shadow-md active:scale-[0.98]"
          @click="goBack"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="transition-transform duration-200 group-hover:-translate-x-0.5"
          >
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          {{ t('error.goBack') }}
        </button>
      </div>
    </div>

    <!-- 底部提示 -->
    <p ref="footerEl" class="absolute bottom-8 text-xs text-muted-foreground/60">
      {{ t('error.contactSupport') }}
    </p>
  </div>
</template>
