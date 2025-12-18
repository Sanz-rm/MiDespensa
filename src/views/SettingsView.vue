<template>
  <ion-page>
    <!-- Cabecera start -->
    <ion-header translucent>
      <ion-toolbar class="top-toolbar">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/home" text="Inicio" />
        </ion-buttons>
        <ion-title>Ajustes</ion-title>
      </ion-toolbar>
    </ion-header>
    <!-- Cabecera end -->

    <ion-content fullscreen class="options-content">
      <ion-header collapse="condense">
        <ion-toolbar class="condense-toolbar">
          <ion-title size="large">Ajustes</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="container">
        <!-- Tarjeta cabecera start -->
        <ion-card class="hero-card">
          <ion-card-content class="hero-content">
            <div class="hero-left">
              <div class="app-badge">
                <ion-icon :icon="sparklesOutline" class="hero-icon" />
              </div>
              <div class="hero-text">
                <ion-text class="hero-title">MI DESPENSA</ion-text>
                <ion-text class="hero-subtitle">Personaliza tu experiencia</ion-text>
              </div>
            </div>

            <ion-note class="hero-version">v{{ appVersion }}</ion-note>
          </ion-card-content>
        </ion-card>
        <!-- Tarjeta cabecera end -->

        <!-- Seccion Apariencia start -->
        <ion-list inset class="list-card">
          <ion-item-divider class="section-divider">Apariencia</ion-item-divider>

          <ion-item lines="full" class="setting-item">
            <ion-icon slot="start" :icon="moonOutline" class="item-icon accent" />
            <ion-label>
              <h2>Tema oscuro</h2>
              <p>Cambia entre claro y oscuro</p>
            </ion-label>
            <ion-toggle :checked="isDark" @ionChange="onThemeToggle" class="accent-toggle" />
          </ion-item>

          <ion-item lines="none" class="setting-item">
            <ion-icon slot="start" :icon="colorPaletteOutline" class="item-icon accent" />
            <ion-label>
              <h2>Color principal</h2>
              <p>Header, acentos e iconos</p>
            </ion-label>

            <div slot="end" class="color-actions">
              <ion-button fill="solid" size="small" class="reset-pill" @click="resetAccentColor">
                Reset
              </ion-button>

              <label class="color-chip" :title="accentColor">
                <input
                  class="color-input"
                  type="color"
                  v-model="accentColor"
                  @input="onAccentColorInput"
                  aria-label="Seleccionar color principal"
                />
              </label>
            </div>
          </ion-item>
        </ion-list>
        <!-- Seccion Apariencia end -->

        <!-- Seccion Datos start -->
        <ion-list inset class="list-card">
          <ion-item-divider class="section-divider">Datos</ion-item-divider>

          <ion-item lines="full" class="setting-item" button @click="onExportData">
            <ion-icon slot="start" :icon="downloadOutline" class="item-icon accent" />
            <ion-label>
              <h2>Exportar</h2>
              <p>Descarga tus datos</p>
            </ion-label>
          </ion-item>

          <ion-item lines="none" class="setting-item" button @click="onClearCache">
            <ion-icon slot="start" :icon="trashOutline" class="item-icon accent" />
            <ion-label>
              <h2>Limpiar caché</h2>
              <p>Soluciona cargas lentas o errores</p>
            </ion-label>
          </ion-item>
        </ion-list>
        <!-- Seccion Datos end -->

        <!-- Seccion App start -->
        <ion-list inset class="list-card">
          <ion-item-divider class="section-divider">App</ion-item-divider>

          <ion-item lines="full" class="setting-item" button @click="onAbout">
            <ion-icon slot="start" :icon="informationCircleOutline" class="item-icon accent" />
            <ion-label>
              <h2>Acerca de</h2>
              <p>Versión, cambios y soporte</p>
            </ion-label>
          </ion-item>

          <ion-item lines="none" class="setting-item" button @click="onExitApp">
            <ion-icon slot="start" :icon="logOutOutline" class="item-icon accent" />
            <ion-label>
              <h2>Salir de la aplicación</h2>
              <p>Cierra MiDespensa</p>
            </ion-label>
          </ion-item>
        </ion-list>
        <!-- Seccion App end -->

        <!-- Pop up confirmar limpiar caché START -->
        <ConfirmPopup
          v-model="showConfirmClearCache"
          title="Limpiar caché"
          message="Vas a borrar la caché y datos locales de la app en este dispositivo. Esta acción no se puede deshacer. Si quieres conservar tus datos, haz una copia con “Exportar” antes de continuar. ¿Quieres limpiar la caché?"
          confirmLabel="Limpiar"
          cancelLabel="Cancelar"
          @confirm="confirmClearCache"
        />
        <!-- Pop up confirmar limpiar caché END -->

        <!-- Espacio footer start -->
        <div class="footer-space" />
        <!-- Espacio footer end -->
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardContent,
  IonText,
  IonNote,
  IonList,
  IonItem,
  IonLabel,
  IonToggle,
  IonIcon,
  IonItemDivider,
  IonButton
} from '@ionic/vue'
import { showToast } from '@/composables/showToast'
import {
  colorPaletteOutline,
  informationCircleOutline,
  trashOutline,
  downloadOutline,
  logOutOutline,
  sparklesOutline,
  moonOutline
} from 'ionicons/icons'
import { initTheme, toggleTheme, accentColor, setAccentColor, resetAccentColor } from '@/theme/theme'
import ConfirmPopup from '@/components/ui/ConfirmPopup.vue'

const isDark = ref(false)
const showConfirmClearCache = ref(false)

function onAccentColorInput() {
  // v-model ya actualiza el ref; esto fuerza validación/normalización por si acaso
  setAccentColor(accentColor.value)
}

onMounted(() => {
  initTheme()
  isDark.value =
    document.body.classList.contains('dark') || document.documentElement.classList.contains('dark')
})

const onThemeToggle = () => {
  toggleTheme()
  isDark.value =
    document.body.classList.contains('dark') || document.documentElement.classList.contains('dark')
}

// const appVersion = computed(() => (import.meta as any).env?.VITE_APP_VERSION ?? '1.0.0')
const appVersion = '1'

const onExportData = () => showToast('Exportar: por implementar (JSON/CSV)', 'light')

const onClearCache = async () => {
  showConfirmClearCache.value = true
}

async function confirmClearCache() {
  try {
    // Limpieza común (web + móvil): Preferences (Capacitor)
    await Preferences.clear()

    // WEB: local/session storage + caches + indexedDB + service worker
    if (Capacitor.getPlatform() === 'web') {
      try {
        localStorage.clear()
      } catch {
        console.error('No se pudo limpiar localStorage')
      }

      try {
        sessionStorage.clear()
      } catch {
        console.error('No se pudo limpiar sessionStorage')
      }

      // Cache Storage (Service Worker cache)
      try {
        if ('caches' in window) {
          const keys = await caches.keys()
          await Promise.all(keys.map((k) => caches.delete(k)))
        }
      } catch {
        console.error('No se pudo limpiar Cache Storage')
      }

      // IndexedDB (si el navegador lo permite)
      try {
        const anyIDB = indexedDB as any
        if (anyIDB?.databases) {
          const dbs = await anyIDB.databases()
          await Promise.all(
            (dbs || [])
              .filter((d: any) => d?.name)
              .map(
                (d: any) =>
                  new Promise<void>((res) => {
                    const req = indexedDB.deleteDatabase(d.name)
                    req.onsuccess = () => res()
                    req.onerror = () => res()
                    req.onblocked = () => res()
                  })
              )
          )
        }
      } catch {
        console.error('No se pudo limpiar IndexedDB')
      }

      // Desregistrar service workers (opcional pero útil para “cache”)
      try {
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations()
          await Promise.all(regs.map((r) => r.unregister()))
        }
      } catch {
        console.error('No se pudieron desregistrar los Service Workers')
      }
    }

    await showToast('Se ha limpiado la caché correctamente', 'success')

    // Recomiendo recargar en web para que se note al instante
    if (Capacitor.getPlatform() === 'web') {
      setTimeout(() => window.location.reload(), 250)
    }
  } catch {
    await showToast('No se pudo limpiar la caché', 'danger')
  }
}

const onAbout = () => showToast(`MiDespensa · v${appVersion.valueOf()}`, 'medium')

const onExitApp = async () => {
  try {
    const mod = await import('@capacitor/app')
    await mod.App.exitApp()
  } catch {
    showToast('Salir de la app solo está disponible en móvil', 'warning')
  }
}
</script>

<style scoped>
/* FONDO PAGINA */
.options-content {
  --background: linear-gradient(
    180deg,
    rgba(var(--md-accent-rgb, 46, 161, 93), 0.08),
    rgba(0, 0, 0, 0)
  );
}

/* TOOLBARS */
.top-toolbar,
.condense-toolbar {
  --background: var(--md-accent, #2ea15d);
  --color: #ffffff;

  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.top-toolbar ion-title,
.condense-toolbar ion-title,
.top-toolbar ion-back-button,
.top-toolbar ion-button,
.top-toolbar ion-icon,
.condense-toolbar ion-button,
.condense-toolbar ion-icon {
  color: #ffffff !important;
}

ion-back-button {
  --color: #ffffff;
}

/* CONTENEDOR */
.container {
  padding: 14px 14px 0;
}

/* HEADER */
.hero-card {
  margin: 8px 0 14px;
  border-radius: 18px;

  border: 1px solid rgba(var(--md-accent-rgb, 46, 161, 93), 0.18);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
}

.hero-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.hero-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* ICONO BCON BADGE */
.app-badge {
  width: 44px;
  height: 44px;

  display: grid;
  place-items: center;

  border-radius: 14px;
  border: 1px solid var(--md-accent, #2ea15d);
  background: var(--md-accent, #a12e2e);

  font-size: 22px;
}

.hero-icon {
  color: #ffffff;
}

.hero-text {
  display: grid;
  gap: 4px;
  line-height: 1.1;
}

.hero-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--ion-text-color2);
}

.hero-subtitle {
  font-size: 13px;
  color: var(--ion-text-color);
}

.hero-version {
  font-weight: 500;
  color: var(--ion-text-color, #ffffff);
  opacity: 1;
}

/* CONTENEDOR DE TARJETAS */
.list-card {
  margin: 0 0 14px;

  border-radius: 18px;
  overflow: hidden;

  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
}

/* DIVISOR DE SECCIONES */
.section-divider {
  font-size: 12px;
  letter-spacing: 0.5px;
  text-transform: uppercase;

  color: var(--ion-text-color) !important;
}

.setting-item {
  --padding-start: 14px;
  --inner-padding-end: 15px;
  --min-height: 56px;
}

/* ICONOS */
.item-icon {
  font-size: 26px;
  margin-left: 3%;
}

.accent {
  color: var(--md-accent, #2ea15d) !important;
}

/* ACTIVA TEMA OSCURO */
.accent-toggle {
  margin-left: 4%;

  --handle-background: #ffffff;
  --handle-background-checked: var(--md-accent, #2ea15d);

  --track-background: rgba(169, 169, 169, 0.35);
  --track-background-checked: rgba(92, 92, 92, 0.42);

  --background: rgba(169, 169, 169, 0.35);
  --background-checked: rgba(169, 169, 169, 0.35);
}

body.dark .accent-toggle {
  --track-background: rgba(255, 255, 255, 0.22);
  --track-background-checked: rgba(206, 206, 206, 0.22);

  --background: rgba(255, 255, 255, 0.22);
  --background-checked: rgba(255, 255, 255, 0.22);

  --handle-background: #ffffff;
  --handle-background-checked: var(--md-accent, #2ea15d);
}

.color-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

/* RESETAR TEMA POR DEFECTO */
.reset-pill {
  height: 30px;

  font-weight: 800;
  text-transform: none;

  --border-radius: 999px;
  --padding-start: 12px;
  --padding-end: 12px;

  --background: rgba(var(--md-accent-rgb, 46, 161, 93), 0.14);
  --background-hover: rgba(var(--md-accent-rgb, 46, 161, 93), 0.2);
  --color: var(--md-accent, #2ea15d);
}

body.dark .reset-pill {
  --background: rgba(255, 255, 255, 0.12);
  --background-hover: rgba(255, 255, 255, 0.16);
  --color: #ffffff;

  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* SELECTOR DE COLOR */
.color-chip {
  width: 34px;
  height: 34px;

  display: inline-grid;
  place-items: center;

  border-radius: 10px;
  overflow: hidden;

  background: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.9);
}

body.dark .color-chip {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid #000000;
}

.color-input {
  width: 34px;
  height: 34px;

  border: 0;
  padding: 0;
  margin: 0;

  background: transparent;
  cursor: pointer;
  outline: none;

  -webkit-appearance: none;
  appearance: none;
}

.color-input::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-input::-webkit-color-swatch,
.color-input::-moz-color-swatch {
  border: 0;
  border-radius: 10px;
}

/* FOOTER ESPACIADO */
.footer-space {
  height: 18px;
}
</style>
