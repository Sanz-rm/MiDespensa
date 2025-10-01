<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />
      <ion-tab-bar slot="bottom" class="tabs">
        <ion-tab-button
          tab="inventory"
          :selected="route.name === 'inventory'"
          @click="navigateTo('inventory')"
        >
          <ion-icon :icon="cubeOutline" />
          <ion-label>Inventario</ion-label>
        </ion-tab-button>

        <ion-tab-button
          tab="home"
          href="/tabs/home"
          :selected="route.name === 'home'"
        >
          <ion-icon :icon="homeOutline" />
          <ion-label>Despensas</ion-label>
        </ion-tab-button>

        <ion-tab-button
          tab="purchase"
          :selected="route.name === 'purchase'"
          @click="navigateTo('purchase')"
        >
          <ion-icon :icon="cartOutline" />
          <ion-label>Compra</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import router from '@/router'
import { IonPage, IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel, toastController } from '@ionic/vue'
import { homeOutline, cubeOutline, cartOutline } from 'ionicons/icons'
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const selectedPantry = ref<string | null>(null)

async function navigateTo(view: 'inventory' | 'purchase') {
  selectedPantry.value = localStorage.getItem('selectedPantry')
  if (selectedPantry.value) {
    router.push({ name: view, params: { code: selectedPantry.value } })
  } else {
    const toast = await toastController.create({
      message: 'Debes seleccionar una despensa',
      duration: 1500,
      position: 'bottom',
      color: 'danger',
    })
    await toast.present()
  }
}
</script>

<style scoped>
.tabs {
  --background: #fff;
  --color: #000;
  --color-selected: #2ea15d;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, .06);
}
</style>
