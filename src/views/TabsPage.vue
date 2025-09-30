<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />
      <ion-tab-bar slot="bottom" class="tabs">
        <ion-tab-button tab="inventary" @click="navigateTo('inventory')">
          <ion-icon :icon="cubeOutline" />
          <ion-label>Inventario</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="home" href="/tabs/home">
          <ion-icon :icon="homeOutline" />
          <ion-label>Despensas</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="purchase" @click="navigateTo('purchase')">
          <ion-icon :icon="cartOutline" />
          <ion-label>Compra</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonTabs, IonRouterOutlet } from '@ionic/vue'
import { IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/vue'
import { homeOutline, cubeOutline, cartOutline } from 'ionicons/icons'
import { useRouter } from 'vue-router'

const router = useRouter()

function navigateTo(nameView: string) {
  let selectedPantry = localStorage.getItem('selectedPantry');
  if (selectedPantry) {
    router.push({ name: nameView, params: { code: selectedPantry } })
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
