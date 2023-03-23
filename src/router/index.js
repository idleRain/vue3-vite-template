import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'

import Layout from '@/view/layout/index.vue'


const routes = [
  {
    path: '/',
    component: Layout,
    redirect: '/hello-world',
    children: [
      {
        path: 'hello-world',
        component: () => import('@/view/HelloWorld/index.vue')
      }
    ]
  }
]

const router  = createRouter({
  history: createWebHashHistory(), // hash 模式
  // history: createWebHistory(), // history模式
  routes
})

export default router
