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
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.confirm-dialog {
  width: 90%;
  max-width: 360px;
  background: #ffffff;
  border-radius: 18px;
  padding: 18px 20px 16px;
  box-shadow: 0 15px 40px rgba(15, 23, 42, 0.25);
  animation: popup-in 0.18s ease-out;
}

.confirm-dialog h2 {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.confirm-dialog p {
  margin: 0 0 16px;
  font-size: 14px;
  color: #4b5563;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.confirm-actions .btn-secondary,
.confirm-actions .btn-danger {
  border: none;
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.confirm-actions .btn-secondary {
  background: #ef4444;
  color: #ffffff;
}

.confirm-actions .btn-danger {
  background: #2ea15d;
  color: #ffffff;
}

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
