import { createRouter, createWebHistory } from '@ionic/vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/home' },
  { path: '/home', name: 'home', component: () => import('@/views/HomePage.vue') },
  {
    path: '/tabs/:code/:name',
    component: () => import('@/views/TabsPage.vue'),
    children: [
      { path: '', redirect: { name: 'inventory' } },
      {
        path: 'inventory',
        name: 'inventory',
        component: () => import('@/views/InventoryPage.vue'),
        props: true,
      },
      {
        path: 'purchase',
        name: 'purchase',
        component: () => import('@/views/PurchasePage.vue'),
        props: true,
      },
    ],
  },

  { path: '/settings', name: 'settings', component: () => import('@/views/SettingsView.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/home' },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
