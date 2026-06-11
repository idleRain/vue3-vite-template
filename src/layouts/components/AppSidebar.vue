<script setup lang="ts">
import type { SidebarProps } from '$ui/sidebar'

import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal
} from '@lucide/vue'
import TeamSwitcher from '@/layouts/components/TeamSwitcher.vue'
import NavProjects from '@/layouts/components/NavProjects.vue'
import NavUser from '@/layouts/components/NavUser.vue'
import NavMain from '@/layouts/components/NavMain.vue'

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '$ui/sidebar'

const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: 'icon'
})

const { t } = useI18n()

// 用户信息（非翻译内容，保持静态）
const user = {
  name: 'Idle Rain',
  email: 'gold.experience@foxmail.com',
  avatar: 'https://avatars.githubusercontent.com/u/68070129?v=4&size=64'
}

// 团队列表
const teams = computed(() => [
  {
    name: t('layout.sidebar.teams.acmeInc'),
    logo: GalleryVerticalEnd,
    plan: t('layout.sidebar.plans.enterprise')
  },
  {
    name: t('layout.sidebar.teams.acmeCorp'),
    logo: AudioWaveform,
    plan: t('layout.sidebar.plans.startup')
  },
  {
    name: t('layout.sidebar.teams.evilCorp'),
    logo: Command,
    plan: t('layout.sidebar.plans.free')
  }
])

// 主导航
const navMain = computed(() => [
  {
    title: t('layout.sidebar.nav.playground.title'),
    url: '#',
    icon: SquareTerminal,
    isActive: true,
    items: [
      { title: t('layout.sidebar.nav.playground.history'), url: '#' },
      { title: t('layout.sidebar.nav.playground.starred'), url: '#' },
      { title: t('layout.sidebar.nav.playground.settings'), url: '#' }
    ]
  },
  {
    title: t('layout.sidebar.nav.models.title'),
    url: '#',
    icon: Bot,
    items: [
      { title: t('layout.sidebar.nav.models.genesis'), url: '#' },
      { title: t('layout.sidebar.nav.models.explorer'), url: '#' },
      { title: t('layout.sidebar.nav.models.quantum'), url: '#' }
    ]
  },
  {
    title: t('layout.sidebar.nav.documentation.title'),
    url: '#',
    icon: BookOpen,
    items: [
      { title: t('layout.sidebar.nav.documentation.introduction'), url: '#' },
      { title: t('layout.sidebar.nav.documentation.getStarted'), url: '#' },
      { title: t('layout.sidebar.nav.documentation.tutorials'), url: '#' },
      { title: t('layout.sidebar.nav.documentation.changelog'), url: '#' }
    ]
  },
  {
    title: t('layout.sidebar.nav.settings.title'),
    url: '#',
    icon: Settings2,
    items: [
      { title: t('layout.sidebar.nav.settings.general'), url: '#' },
      { title: t('layout.sidebar.nav.settings.team'), url: '#' },
      { title: t('layout.sidebar.nav.settings.billing'), url: '#' },
      { title: t('layout.sidebar.nav.settings.limits'), url: '#' }
    ]
  }
])

// 项目列表
const projects = computed(() => [
  {
    name: t('layout.sidebar.projects.designEngineering'),
    url: '#',
    icon: Frame
  },
  {
    name: t('layout.sidebar.projects.salesMarketing'),
    url: '#',
    icon: PieChart
  },
  {
    name: t('layout.sidebar.projects.travel'),
    url: '#',
    icon: Map
  }
])
</script>

<template>
  <Sidebar v-bind="props">
    <SidebarHeader>
      <TeamSwitcher :teams="teams" />
    </SidebarHeader>
    <SidebarContent>
      <NavMain :items="navMain" />
      <NavProjects :projects="projects" />
    </SidebarContent>
    <SidebarFooter>
      <NavUser :user="user" />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>
