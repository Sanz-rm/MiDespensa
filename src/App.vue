<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { onBeforeMount } from 'vue';
import { initTheme } from './theme/theme';

onBeforeMount(() => {
  initTheme();
});
</script>