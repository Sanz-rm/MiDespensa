import { createRouter, createWebHistory } from '@ionic/vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/tabs/home' },
  {
    path: '/tabs',
    component: () => import('@/views/TabsPage.vue'),
    children: [
      { path: '', redirect: '/tabs/home' },
      { path: 'home', name: 'home', component: () => import('@/views/HomePage.vue') },

      {
        path: 'pantry/:code/inventory',
        name: 'inventory',
        component: () => import('@/views/InventoryPage.vue'),
        props: true,
        alias: ['inventory/:code'],
      },
      {
        path: 'pantry/:code/purchase',
        name: 'purchase',
        component: () => import('@/views/PurchasePage.vue'),
        props: true,
        alias: ['purchase/:code'],
      },
    ],
  },
  { path: '/settings', name: 'settings', component: () => import('@/views/SettingsView.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/tabs/home' },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
