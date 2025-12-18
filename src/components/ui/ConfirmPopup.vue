<template>
  <div v-if="modelValue" class="confirm-overlay">
    <div class="confirm-dialog">
      <h2 v-if="title">{{ title }}</h2>
      <p v-if="message">{{ message }}</p>

      <div class="confirm-actions">
        <button type="button" class="btn-secondary" @click="onCancel">
          {{ cancelLabel }}
        </button>
        <button type="button" class="btn-danger" @click="onConfirm">
          {{ confirmLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  modelValue: { type: Boolean, required: true },
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Aceptar' },
  cancelLabel: { type: String, default: 'Cancelar' }
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

function onCancel() {
  emit('update:modelValue', false)
  emit('cancel')
}

function onConfirm() {
  emit('update:modelValue', false)
  emit('confirm')
}
</script>
<style scoped>
/* OVERLAY CONFIRMAR */
.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;

  display: flex;
  align-items: center;
  justify-content: center;

  background: rgba(15, 23, 42, 0.45);
}

/* CONTENEDOR CONFIRMAR */
.confirm-dialog {
  width: min(360px, 90%);
  padding: 18px 20px 16px;

  background: var(--ion-background-color2);
  border-radius: 18px;

  box-shadow: 0 15px 40px rgba(15, 23, 42, 0.25);
  animation: popup-in 180ms ease-out;
}

/* TEXTOS */
.confirm-dialog h2 {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 700;
  color: var(--ion-text-color);
}

.confirm-dialog p {
  margin: 0 0 16px;
  font-size: 14px;
  color: var(--ion-text-color2);
}

/* BOTONES */
.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.confirm-actions button {
  border: none;
  border-radius: 999px;
  padding: 8px 14px;

  font-size: 14px;
  font-weight: 600;

  cursor: pointer;
  transition: transform 120ms ease, filter 120ms ease;
}

.confirm-actions button:active {
  transform: scale(0.98);
}

.confirm-actions button:focus-visible {
  outline: 2px solid rgba(var(--md-accent-rgb, 46, 161, 93), 0.7);
  outline-offset: 2px;
}

/* BOTON CANCELAR */
.btn-secondary {
  background: #ef4444;
  color: #ffffff;
}

/* BOTON CONFIRMAR */
.btn-danger {
  background: var(--md-accent, #2ea15d);
  color: #ffffff;
}

/* ANIMACIÓN POPUP */
@keyframes popup-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
