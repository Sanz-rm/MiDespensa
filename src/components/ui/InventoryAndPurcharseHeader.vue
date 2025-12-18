<!-- src/components/InventoryAndPurcharseHeader.vue -->
<template>
  <ion-header class="rounded-header">
    <ion-toolbar class="back-toolbar">
      <ion-buttons slot="start">
        <ion-button :routerLink="backHref" routerDirection="root" fill="clear">
          <ion-icon :icon="arrowBackOutline" style="font-size:28px;" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ props.title }}</ion-title>
    </ion-toolbar>
  </ion-header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonTitle,
} from '@ionic/vue'
import { arrowBackOutline } from 'ionicons/icons'

const props = defineProps<{
  title: string
  backHref?: string    // URL completa a la que quieres ir
}>()

// si no pasas nada, por defecto va a /home
const backHref = computed(() => props.backHref ?? '/home')
</script>

<style scoped>
/* HEADER */
.rounded-header {
  --ion-background-color: var(--md-accent, #2ea15d);
  --color: #ffffff;
  --box-shadow: none;

  background: var(--md-accent, #2ea15d) !important;
  box-shadow: none !important;

  border: 0;
  padding: 0;
  overflow: visible;
}

/* TOOLBAR */
.toolbar {
  --background: transparent;
  --border-width: 0;
  padding-inline: 4px;
}

/* BOTON VOLVER  */
ion-header.rounded-header ion-buttons ion-button { 
  --color: #fff; 
}

ion-header.rounded-header ion-icon { 
  color: #fff; 
  font-weight: 900; }

/* TITULO */
ion-header.rounded-header ion-title { 
  color: #fff; 
  font-weight: 700; 
  }
</style>