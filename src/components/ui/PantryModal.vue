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
/* Dar forma al contenedor interno del modal */
.mds-modal::part(content) {
  width: 92vw;
  max-width: 420px;
  height: 100vw;
  max-height: 100vh;
  border-radius: 22px;
  box-shadow: 0 10px 30px rgba(0,0,0,.18);
  overflow: visible;
  background: transparent;
}

/* Oscurecer fondo del modal*/
.mds-modal::part(backdrop) {
  background: rgba(0,0,0,.4);
  opacity: 1;
}

/* Force the overlay backdrop to cover the entire viewport (defensive) */
.mds-modal::part(backdrop) {
  position: fixed;
  inset: 0;
}

/* Dejar el content transparente (el “card” pone el blanco) */
.mds-modal ion-content {
  --background: transparent;
}


/* arjeta por dentro */
.modal-card {
  background: #ffffff;
  border-radius: 22px;
  overflow: hidden;
  box-shadow: var(--box-shadow);
}

/* Cabecera verde */
.modal-head {
  position: relative;
  background: #2e9b52;
  color: #fff;
  padding: 28px 20px 22px;
  border-bottom-left-radius: 22px;
  border-bottom-right-radius: 22px;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: transparent;
  border: 0;
  color: #fff;
  padding: 6px;
  border-radius: 999px;
  line-height: 0;
}

.head-icon {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  background: rgba(255,255,255,.2);
  display: grid;
  place-items: center;
  margin: 0 auto 10px;
}

.head-icon .material-icons { font-size: 24px; color: #fff; }

.head-title {
  text-align: center;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: .2px;
  margin: 0;
}

/* Cuerpo del modal */
.modal-body {
  padding: 16px 18px 18px;
}

.field-label {
  display: block;
  font-weight: 700;
  color: #222;
  margin: 8px 2px 8px;
}

.field-item {
  --background: #fff;
  --inner-padding-end: 0;
  --inner-padding-start: 0;
  --padding-start: 10px;
  --padding-end: 0;
  border-radius: 12px;
  box-shadow: 0 4px 14px rgba(0,0,0,.08);
  margin-bottom: 14px;
}

.field-item ion-input::part(native) {
  padding: 12px 14px;
  font-size: 16px;
}

/* Botones */
.modal-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 6px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  column-gap: 8px;
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 15px;
  border: 2px solid transparent;
  transition: transform .04s ease;
}

.btn:active { transform: translateY(1px); }

.btn-outline {
  background: #fff;
  color: #2e9b52;
  border-color: #2e9b52;
}

.btn-solid {
  background: #2e9b52;
  color: #fff;
}

.spinner {
  margin-right: 6px;
  --color: #fff;
}
</style>
