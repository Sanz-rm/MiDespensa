<template>
  <ion-modal
  ref="modalRef"
  :is-open="modelOpen"
  css-class="mds-modal"
  @willPresent="onWillPresent"
  @didPresent="onDidPresent"
  @willDismiss="onWillDismiss"
  @didDismiss="onDidDismiss"
  >
    <ion-content class="ion-padding">

      <!-- Tarjeta del modal start -->
      <div class="modal-card">
        <!-- Cabecera verde start -->
        <div class="modal-head">
          <button class="close-btn" :disabled="submitting" @click="close()" aria-label="Cerrar">
            <span class="material-icons">close</span>
          </button>

          <div class="head-icon">
            <span class="material-icons">home</span>
          </div>

          <h2 class="head-title">
            {{ isCreate ? 'Nueva despensa' : 'Unirse a una despensa' }}
          </h2>
        </div>
        <!-- Cabecera verde end -->

        <!-- Cuerpo modal start -->
        <div class="modal-body">
          <!-- MODO CREAR  start -->
          <template v-if="isCreate">
            <label class="field-label">Nombre de la despensa</label>
            <ion-item lines="none" class="field-item">
              <ion-input
                ref="nameInputRef"
                v-model="name"
                :disabled="submitting"
                placeholder="Ej: Despensa 1"
              />
            </ion-item>
          </template>
          <!-- MODO CREAR end -->

          <!-- MODO UNIRSE start-->
          <template v-else>
            <label class="field-label">Código de la despensa</label>
            <ion-item lines="none" class="field-item">
              <ion-input
                v-model="code"
                :disabled="submitting"
                placeholder="Ej: 28T34G"
                @ionInput="code = code.toUpperCase().trim()"
              />
            </ion-item>
          </template>
          <!-- MODO UNIRSE end-->

          <!-- Botones start -->
          <div class="modal-actions">
            <button class="btn btn-outline" :disabled="submitting" @click="close()">
              <span class="material-icons">close</span>
              Cancelar
            </button>

            <button
              class="btn btn-solid"
              :disabled="isDisabled || submitting"
              @click="onConfirm"
            >
              <ion-spinner v-if="submitting" name="crescent" class="spinner" />
              <template v-else>
                <span class="material-icons">check</span>
                Aceptar
              </template>
            </button>
          </div>
          <!-- Botones end -->
        </div>
        <!-- Cuerpo modal end -->
      </div>
      <!-- Tarjeta del modal end -->
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import {
  IonModal, IonContent, IonItem, IonInput, IonSpinner
} from '@ionic/vue'
import { computed, ref } from 'vue'

// v-model de apertura/cierre 
const modelOpen = defineModel<boolean>({ default: false })

const props = defineProps<{ mode: 'create' | 'join' }>()

const emit = defineEmits<{
  (e: 'confirm', payload: { name: string } | { code: string }): void
  (e: 'close'): void
}>()

// Estado local 
const name = ref('')
const code = ref('')
const submitting = ref(false)

const isCreate = computed(() => props.mode === 'create')
const isDisabled = computed(() =>
  isCreate.value ? name.value.trim().length < 2 : code.value.trim().length < 4
)

// Modal refs & accessibility helpers
const modalRef = ref<HTMLElement | null>(null)
const nameInputRef = ref<HTMLElement | null>(null)

function setInertOnOutlet(enabled: boolean) {
  try {
    const outlet = document.querySelector('ion-router-outlet') as HTMLElement | null
    if (outlet) {
      if (enabled) outlet.setAttribute('inert', 'true')
      else outlet.removeAttribute('inert')
      return
    }

    // Fallback: apply inert to body children except overlays
    const children = Array.from(document.body.children) as HTMLElement[]
    children.forEach(c => {
      const isOverlay = c.hasAttribute('ion-overlay') || c.getAttribute('role') === 'dialog'
      if (isOverlay) return
      if (enabled) c.setAttribute('inert', 'true')
      else c.removeAttribute('inert')
    })
  } catch {}
}

function onWillPresent() {
  setInertOnOutlet(true)
}

function onDidPresent() {
  try {
    if (isCreate.value && nameInputRef.value && typeof (nameInputRef.value as any).setFocus === 'function') {
      ;(nameInputRef.value as any).setFocus()
    } else if (isCreate.value && nameInputRef.value) {
      const native = (nameInputRef.value as HTMLElement).querySelector?.('input') as HTMLInputElement | null
      native?.focus()
    }
  } catch {}
}

function onWillDismiss() {
  // Blur any active element inside the modal before the dismiss animation applies aria-hidden
  try {
    const active = document.activeElement as HTMLElement | null
    if (active && typeof active.blur === 'function') active.blur()
  } catch {}
}

function onDidDismiss() {
  try {
    setInertOnOutlet(false)
    const active = document.activeElement as HTMLElement | null
    if (active && typeof active.blur === 'function') active.blur()
  } catch {}
  reset()
  emit('close')
}

function reset() {
  name.value = ''
  code.value = ''
  submitting.value = false
}

function close() {
  // Ensure nothing inside the modal keeps focus before hiding it.
  try {
    const active = document.activeElement as HTMLElement | null
    if (active && typeof active.blur === 'function') active.blur()
  } catch {}

  modelOpen.value = false
  emit('close')
  setTimeout(reset, 120)
}

async function onConfirm() {
  submitting.value = true
  try {
    if (isCreate.value) {
      emit('confirm', { name: name.value.trim() })
    } else {
      emit('confirm', { code: code.value.trim().toUpperCase() })
    }
  } finally {
    submitting.value = false
  }
}
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

/* RESPONSIVE (Ajustes para pantallas un poco más grandes) */
@media (min-width: 420px) {
  .banner {
    padding: 16px 22px;
  }

  .logo {
    width: 38px;
    height: 38px;
  }

  .title {
    font-size: 22px;
  }
}
</style>
