<!-- PantryHeader.vue -->
<template>
  <header class="banner" role="banner">
    <div class="left">
      <img class="logo" src="@/assets/img/logo-mi-despensa.png" :alt="alt" />
      <h1 class="title">{{ title }}</h1>
    </div>

    <div class="right">
      <button
        ref="btnRef"
        class="menu-btn"
        @click="toggle"
        :aria-expanded="isOpen.toString()"
        aria-haspopup="menu"
        aria-controls="header-menu"
        title="Abrir menú"
      >
        <span class="sr-only">Abrir menú</span>
        <span class="hamb"><span></span><span></span><span></span></span>
      </button>

      <nav
        v-if="isOpen"
        id="header-menu"
        class="menu"
        role="menu"
        ref="menuRef"
        @keydown.esc="close"
      >
        <ul>
          <li><button role="menuitem" @click="onMenu('settings')">Ajustes</button></li>
          <li><button role="menuitem" @click="onMenu('exit')">Salir</button></li>
        </ul>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'

type Props = {
  title?: string
  logo?: string
  alt?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'MI DESPENSA',
  alt: 'Logo Mi Despensa'
})

const { title, alt } = props

const emit = defineEmits<{ (e: 'menu', action: string): void }>()
const router = useRouter()

const isOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)
const btnRef = ref<HTMLButtonElement | null>(null)

const toggle = () => { isOpen.value = !isOpen.value }
const close = () => { isOpen.value = false }

const exitApp = async () => {
  if (Capacitor.isNativePlatform()) {
    await App.exitApp()
    return
  }
  window.close()
  location.replace('about:blank')
}

const onMenu = async (action: string) => {
  emit('menu', action)

  if (action === 'settings') {
    try {
      await router.push({ name: 'settings' })
    } catch {}
  } else if (action === 'exit') {
    await exitApp()
  }

  await nextTick()
  isOpen.value = false
}

const onDocClick = (e: MouseEvent) => {
  if (!isOpen.value) return
  const target = e.target as Node
  const clickedOutsideMenu = menuRef.value && !menuRef.value.contains(target)
  const clickedOutsideBtn = btnRef.value && !btnRef.value.contains(target)
  if (clickedOutsideMenu && clickedOutsideBtn) close()
}

onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<style scoped>
.banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  background: #2ea15d;
  color: #fff;
  border-bottom-left-radius: 18px;
  border-bottom-right-radius: 18px;
  box-shadow: 0 2px 6px rgba(0,0,0,.12);
  position: relative;
  z-index: 10;
}

.left { display: flex; align-items: center; gap: 12px; }

.logo {
  width: 84px; height: 84px; display: block; object-fit: contain;
  filter: brightness(0) invert(1);
}

.title { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: .4px; text-transform: uppercase; line-height: 1; }

.right { position: relative; }

.menu-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 38px; height: 38px; border-radius: 10px; border: none;
  background: rgba(255,255,255,.18); cursor: pointer; transition: background .2s ease;
}
.menu-btn:hover { background: rgba(255,255,255,.28); }
.menu-btn:focus { outline: 2px solid rgba(255,255,255,.7); outline-offset: 2px; }

.hamb { display: inline-flex; flex-direction: column; gap: 4px; }
.hamb > span { display: block; width: 18px; height: 2px; background: #fff; border-radius: 2px; }

.menu {
  position: absolute; top: calc(100% + 8px); right: 0; min-width: 180px;
  background: #fff; color: #222; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,.18);
  padding: 6px; z-index: 20;
}

.menu ul { list-style: none; margin: 0; padding: 4px; }
.menu li + li { margin-top: 4px; }

.menu button[role="menuitem"] {
  width: 100%; text-align: left; background: transparent; border: none;
  padding: 10px 12px; border-radius: 8px; cursor: pointer; font: inherit; color: inherit; transition: background .15s ease;
}
.menu button[role="menuitem"]:hover { background: rgba(0,0,0,.06); }

.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0,0,1px,1px); white-space: nowrap; border: 0;
}

@media (min-width: 420px) {
  .banner { padding: 16px 22px; }
  .logo { width: 38px; height: 38px; }
  .title { font-size: 22px; }
}
</style>
