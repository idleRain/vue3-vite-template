import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    redirect: 'example'
  },
  {
    path: '/example',
    component: () => import('@/layouts/ExampleLayout.vue'),
    children: [
      {
        path: '',
        name: 'example',
        component: () => import('@/views/example/index.vue'),
        meta: {
          title: 'Example Page'
        }
      }
    ]
  },
  {
    path: '/401',
    name: '401',
    component: () => import('@/views/error/401.vue'),
    meta: { title: '401 Unauthorized' }
  },
  {
    path: '/403',
    name: '403',
    component: () => import('@/views/error/403.vue'),
    meta: { title: '403 Forbidden' }
  },
  {
    path: '/500',
    name: '500',
    component: () => import('@/views/error/500.vue'),
    meta: { title: '500 Server Error' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '404 Not Found' }
  }
]

export default routes
