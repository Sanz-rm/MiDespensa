<template>
  <header class="banner" role="banner">
    <div class="left">
      <img class="logo" src="@/assets/img/logo-midespensa.png" :alt="alt" />
      <h1 class="title">{{ title }}</h1>
    </div>

    <div class="right">
      <button
        ref="btnRef"
        class="menu-btn"
        @click="toggle"
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
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'

type Props = {
  title?: string
  alt?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'MI DESPENSA',
  alt: 'Logo Mi Despensa'
})

const emit = defineEmits<{ (e: 'menu', action: string): void }>()
const router = useRouter()

const isOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)
const btnRef = ref<HTMLButtonElement | null>(null)

const title = computed(() => props.title)
const alt = computed(() => props.alt)

const isNative = () =>
  typeof (Capacitor as any).isNativePlatform === 'function'
    ? (Capacitor as any).isNativePlatform()
    : Capacitor.getPlatform() !== 'web'

const toggle = () => { isOpen.value = !isOpen.value }
const close = () => { isOpen.value = false }

const gracefulWebExit = async () => {
  if (window.history.length > 1) {
    window.history.back()
  } else {
    try {
      await router.replace({ name: 'home' } as any)
    } catch {
      location.href = '/'
    }
  }
}

const exitApp = async () => {
  if (isNative()) {
    try {
      await App.exitApp()
      return
    } catch {}
  }
  await gracefulWebExit()
}

const onMenu = async (action: string) => {
  emit('menu', action)

  if (action === 'settings') {
    try {
      await router.push({ name: 'settings' } as any)
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

let removeBackListener: (() => void) | null = null

onMounted(async () => {
  document.addEventListener('click', onDocClick)

  if (isNative()) {
    try {
      const { remove } = await App.addListener('backButton', ({ canGoBack }) => {
        if (isOpen.value) {
          close()
          return
        }
        if (canGoBack) {
          router.back()
        } else {
          App.exitApp().catch(() => {})
        }
      })
      removeBackListener = remove
    } catch {}
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  if (removeBackListener) {
    try { removeBackListener() } catch {}
    removeBackListener = null
  }
})
</script>


<style scoped>
/* HEADER */
.banner {
  position: relative;
  z-index: 10;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  padding: 14px 18px;
  padding-top: 8%;

  background: var(--md-accent, #2ea15d);
  color: #fff;

  border-bottom-left-radius: 18px;
  border-bottom-right-radius: 18px;

  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.left {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* LOGO */
.logo {
  width: 84px;
  height: 84px;
  display: block;
  object-fit: contain;
  filter: brightness(0) invert(1);
}

/* TÍTULO PRINCIPAL */
.title {
  margin: 0;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  font-size: 20px;
  font-weight: 800;
}

.right {
  position: relative;
}

/* MENU */
.menu-btn {
  width: 38px;
  height: 38px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.18);

  cursor: pointer;
  transition: background 0.2s ease, transform 0.08s ease, border-color 0.2s ease;
}

.menu-btn:hover {
  background: rgba(255, 255, 255, 0.28);
}

body.dark .menu-btn {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.18);
}

/* MENU HAMBURGUESA */
.hamb {
  display: inline-flex;
  flex-direction: column;
  gap: 4px;
}

.hamb > span {
  width: 18px;
  height: 2px;
  display: block;
  border-radius: 2px;
  background: #fff;
}

.menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 20;

  min-width: 180px;
  padding: 6px;

  background: #fff;
  color: #222;

  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.18);
}

body.dark .menu {
  background: rgba(20, 20, 20, 0.92);
  color: rgba(255, 255, 255, 0.92);

  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.55);

  backdrop-filter: blur(10px);
}

.menu ul {
  list-style: none;
  margin: 0;
  padding: 4px;
}

.menu li + li {
  margin-top: 4px;
}

.menu button[role='menuitem'] {
  width: 100%;
  padding: 10px 12px;

  text-align: left;
  font: inherit;
  color: inherit;

  background: transparent;
  border: none;
  border-radius: 8px;

  cursor: pointer;
  transition: background 0.15s ease;
}

/* HOVER EN MODO CLARO */
.menu button[role='menuitem']:hover {
  background: rgba(0, 0, 0, 0.06);
}

/* HOVER EN MODO OSCURO */
body.dark .menu button[role='menuitem']:hover {
  background: rgba(255, 255, 255, 0.1);
}

/*ACCESSIBILITY (SR-ONLY) */
.sr-only {
  position: absolute;

  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;

  overflow: hidden;
  clip: rect(0, 0, 1px, 1px);
  white-space: nowrap;
  border: 0;
}


@media (min-width: 477px) {
  .banner {
    justify-content: center;
    padding-top: 16px;
  }

  .left {
    position: static;
    transform: none;
    margin: 0 auto;
    justify-content: center;
  }

  .right {
    position: absolute;
    right: 18px;
    top: 50%;
    transform: translateY(-50%);
  }
}
</style>

