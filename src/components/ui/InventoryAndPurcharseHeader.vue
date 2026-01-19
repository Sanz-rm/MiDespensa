<template>
  <ion-header class="rounded-header">
    <ion-toolbar class="back-toolbar">
      <ion-buttons slot="start">
        <ion-button :routerLink="backHref" routerDirection="root" fill="clear">
          <ion-icon :icon="arrowBackOutline" style="font-size:28px;" />
        </ion-button>
      </ion-buttons>
      <ion-title class="title">{{ props.title }}</ion-title>
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
.title { 
  color: #fff; 
  letter-spacing: 0.4px;
  font-size: 20px;
  font-weight: 700;
}


@media (min-width: 820px) {
  ion-toolbar.back-toolbar {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  ion-toolbar.back-toolbar ion-buttons[slot="start"] {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
  }

  ion-toolbar.back-toolbar ion-title.title {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    width: auto;
    margin: 0;
    padding: 0;
  }
}

</style>