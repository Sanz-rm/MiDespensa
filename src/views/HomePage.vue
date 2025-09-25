<template>
  <ion-card v-for="(ruta, nombre) in productos" :key="nombre">
    <img :alt="nombre" :src="ruta" />
    <ion-card-header>
      <ion-card-title>{{ nombre }}</ion-card-title>
    </ion-card-header>
  </ion-card>
</template>

<script setup lang="ts">
import { IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle } from '@ionic/vue'

// objeto de productos con nombre → ruta
const productos: Record<string, string> = {
  platano: '../assets/img/products/platano.png',
  naranja: '/img/products/naranja.png',
  leche: '/img/products/leche.png'
}
</script>