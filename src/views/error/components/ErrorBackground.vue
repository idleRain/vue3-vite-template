<script setup lang="ts">
import gsap from 'gsap'

const props = defineProps<{
  type: '404' | '500' | '401' | '403'
}>()

const container = useTemplateRef<HTMLElement>('container')
const mouse = { x: 0, y: 0 }

function onMouseMove(e: MouseEvent) {
  mouse.x = (e.clientX / window.innerWidth - 0.5) * 2
  mouse.y = (e.clientY / window.innerHeight - 0.5) * 2
}

let ctx: gsap.Context | null = null

onMounted(() => {
  if (!container.value) return
  ctx = gsap.context(() => {
    if (props.type === '404') initSpace()
    if (props.type === '500') initGlitch()
    if (props.type === '401') initLock()
    if (props.type === '403') initBarrier()
  }, container.value)

  window.addEventListener('mousemove', onMouseMove)
})

onUnmounted(() => {
  ctx?.revert()
  window.removeEventListener('mousemove', onMouseMove)
})

function initSpace() {
  const stars = gsap.utils.toArray<HTMLElement>('.star-404')
  const orbits = gsap.utils.toArray<HTMLElement>('.orbit-404')

  stars.forEach(star => {
    gsap.to(star, {
      y: `random(-30, 30)`,
      x: `random(-20, 20)`,
      opacity: `random(0.2, 0.9)`,
      duration: `random(3, 6)`,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: `random(0, 3)`
    })
  })

  orbits.forEach((orbit, i) => {
    gsap.to(orbit, {
      rotation: i % 2 === 0 ? 360 : -360,
      duration: 15 + i * 8,
      repeat: -1,
      ease: 'none',
      transformOrigin: '50% 50%'
    })
  })

  // 鼠标视差
  gsap.ticker.add(() => {
    stars.forEach((star, i) => {
      const depth = ((i % 3) + 1) * 0.3
      gsap.set(star, {
        x: `+=${mouse.x * depth * 0.5}`,
        y: `+=${mouse.y * depth * 0.5}`
      })
    })
  })
}

function initGlitch() {
  const bars = gsap.utils.toArray<HTMLElement>('.glitch-bar')
  const lines = gsap.utils.toArray<HTMLElement>('.scan-line')

  // 随机闪烁方块
  function glitchPulse() {
    bars.forEach(bar => {
      if (Math.random() > 0.6) {
        gsap.fromTo(
          bar,
          { scaleX: 0, opacity: 0, x: 0 },
          {
            scaleX: 1,
            opacity: `random(0.05, 0.2)`,
            x: `random(-20, 20)`,
            duration: `random(0.1, 0.3)`,
            ease: 'power4.out',
            onComplete: () => {
              gsap.to(bar, {
                opacity: 0,
                scaleX: 0,
                duration: `random(0.05, 0.15)`,
                delay: `random(0.05, 0.2)`
              })
            }
          }
        )
      }
    })

    // 大 glitch: 偶尔触发整个画面偏移
    if (Math.random() > 0.85 && container.value) {
      gsap.to(container.value, {
        x: `random(-5, 5)`,
        duration: 0.05,
        repeat: 3,
        yoyo: true,
        ease: 'power4.inOut',
        onComplete: () => {
          if (container.value) gsap.set(container.value, { x: 0 })
        }
      })
    }

    setTimeout(glitchPulse, 200 + Math.random() * 600)
  }
  glitchPulse()

  // 扫描线
  lines.forEach((line, i) => {
    gsap.to(line, {
      opacity: 0.6,
      scaleX: 1,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: i * 0.5
    })
  })
}

function initLock() {
  const rings = gsap.utils.toArray<HTMLElement>('.lock-ring')
  const particles = gsap.utils.toArray<HTMLElement>('.lock-particle')

  rings.forEach((ring, i) => {
    gsap.to(ring, {
      rotation: i % 2 === 0 ? 360 : -360,
      duration: 10 + i * 5,
      repeat: -1,
      ease: 'none',
      transformOrigin: '50% 50%'
    })
  })

  particles.forEach(p => {
    gsap.to(p, {
      x: `random(-15, 15)`,
      y: `random(-15, 15)`,
      opacity: `random(0.1, 0.5)`,
      scale: `random(0.5, 1.2)`,
      duration: `random(4, 8)`,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: `random(0, 4)`
    })
  })

  // 鼠标接近时粒子加速
  gsap.ticker.add(() => {
    particles.forEach(p => {
      const dx = mouse.x * 30
      const dy = mouse.y * 30
      gsap.to(p, {
        x: `+=${dx * 0.02}`,
        y: `+=${dy * 0.02}`,
        duration: 0.5,
        overwrite: 'auto'
      })
    })
  })
}

function initBarrier() {
  const waves = gsap.utils.toArray<HTMLElement>('.barrier-wave')
  const dots = gsap.utils.toArray<HTMLElement>('.barrier-dot')

  waves.forEach((wave, i) => {
    gsap.fromTo(
      wave,
      { scale: 0.3, opacity: 0.5 },
      {
        scale: 2.5,
        opacity: 0,
        duration: 3,
        repeat: -1,
        ease: 'power2.out',
        delay: i * 1
      }
    )
  })

  dots.forEach(dot => {
    const angle = Math.random() * Math.PI * 2
    const radius = 80 + Math.random() * 150

    gsap.set(dot, {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    })

    gsap.to(dot, {
      x: `+=${(Math.random() - 0.5) * 60}`,
      y: `+=${(Math.random() - 0.5) * 60}`,
      opacity: `random(0.15, 0.5)`,
      duration: `random(3, 6)`,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: `random(0, 3)`
    })
  })
}
</script>

<template>
  <div ref="container" class="pointer-events-none absolute inset-0 overflow-hidden">
    <!-- 404: 太空星尘 -->
    <template v-if="type === '404'">
      <div
        v-for="i in 30"
        :key="`star-${i}`"
        :class="i % 5 === 0 ? 'bg-primary/40' : 'bg-foreground/20'"
        :style="{
          width: `${(i % 3) * 2 + 2}px`,
          height: `${(i % 3) * 2 + 2}px`,
          left: `${(i * 37) % 100}%`,
          top: `${(i * 53) % 100}%`,
          opacity: 0.3
        }"
        class="star-404 absolute rounded-full"
      />
      <div
        v-for="i in 4"
        :key="`orbit-${i}`"
        :style="{
          width: `${100 + i * 90}px`,
          height: `${100 + i * 90}px`,
          left: '50%',
          top: '50%',
          marginLeft: `${-(100 + i * 90) / 2}px`,
          marginTop: `${-(100 + i * 90) / 2}px`
        }"
        class="orbit-404 absolute rounded-full border border-primary/8"
      >
        <div
          class="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-primary/25 blur-[1px]"
        />
      </div>
    </template>

    <!-- 500: 故障方块 -->
    <template v-if="type === '500'">
      <div
        v-for="i in 15"
        :key="`bar-${i}`"
        :style="{
          width: `${((i * 47) % 200) + 60}px`,
          height: `${(i % 3) * 2 + 2}px`,
          left: `${(i * 31) % 100}%`,
          top: `${(i * 43) % 100}%`,
          transformOrigin: 'left center',
          opacity: 0
        }"
        class="glitch-bar absolute bg-destructive/10"
      />
      <div
        v-for="i in 8"
        :key="`scan-${i}`"
        :style="{
          top: `${(i / 9) * 100}%`,
          opacity: 0,
          transform: 'scaleX(0)'
        }"
        class="scan-line absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-destructive/25 to-transparent"
      />
    </template>

    <!-- 401: 锁定光环 -->
    <template v-if="type === '401'">
      <div
        v-for="i in 3"
        :key="`ring-${i}`"
        :style="{
          width: `${160 + i * 110}px`,
          height: `${160 + i * 110}px`,
          left: '50%',
          top: '50%',
          marginLeft: `${-(160 + i * 110) / 2}px`,
          marginTop: `${-(160 + i * 110) / 2}px`
        }"
        class="lock-ring absolute rounded-full border border-primary/10"
      >
        <div
          class="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-primary/20 blur-[1px]"
        />
        <div class="absolute -bottom-1 left-1/3 h-2 w-2 rounded-full bg-primary/15 blur-[1px]" />
      </div>
      <div
        v-for="i in 20"
        :key="`dot-${i}`"
        :style="{
          width: `${(i % 3) + 1}px`,
          height: `${(i % 3) + 1}px`,
          left: `${(i * 41) % 100}%`,
          top: `${(i * 59) % 100}%`
        }"
        class="lock-particle absolute rounded-full bg-primary/10"
      />
    </template>

    <!-- 403: 能量屏障 -->
    <template v-if="type === '403'">
      <div
        v-for="i in 4"
        :key="`wave-${i}`"
        :style="{
          width: '200px',
          height: '200px',
          opacity: 0
        }"
        class="barrier-wave absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/10"
      />
      <div
        v-for="i in 25"
        :key="`dot-${i}`"
        class="barrier-dot absolute top-1/2 left-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20"
      />
    </template>
  </div>
</template>
