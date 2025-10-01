<!-- src/views/OptionsView.vue -->
<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/home" text="Inicio"></ion-back-button>
        </ion-buttons>
        <ion-title>Ajustes</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content fullscreen>
      <div class="content">
         <ion-toolbar>
        <ion-title>Cambiar tema</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="onToggleTheme">Tema</ion-button>
        </ion-buttons>
      </ion-toolbar>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton
} from '@ionic/vue'
import { toggleTheme } from '@/theme/theme';
const onToggleTheme = () => toggleTheme();
</script>

<style scoped>
.content { padding: 16px; }
</style>
