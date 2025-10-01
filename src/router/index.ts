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
      { path: 'inventory/:code', name: 'inventory', component: () => import('@/views/InventoryPage.vue'), props: true },
      { path: 'purchase/:code',  name: 'purchase',  component: () => import('@/views/PurchasePage.vue'),  props: true },
    ],
  },
  { path: '/settings', name: 'settings', component: () => import('@/views/SettingsView.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/tabs/home' },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Guard: evita navegar a inventory/purchase sin :code
router.beforeEach((to, _from, next) => {
  if ((to.name === 'inventory' || to.name === 'purchase') && !to.params.code) {
    return next({ name: 'home' })
  }
  next()
})

export default router
