<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />
      <ion-tab-bar slot="bottom" class="tabs">
        <ion-tab-button tab="inventory" :href="inventoryHref" :disabled="!selectedPantry">
          <ion-icon :icon="cubeOutline" />
          <ion-label>Inventario</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="home" href="/tabs/home">
          <ion-icon :icon="homeOutline" />
          <ion-label>Despensas</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="purchase" :href="purchaseHref" :disabled="!selectedPantry">
          <ion-icon :icon="cartOutline" />
          <ion-label>Compra</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/vue'
import { homeOutline, cubeOutline, cartOutline } from 'ionicons/icons'
import { ref, computed, onMounted } from 'vue'

const selectedPantry = ref<string | null>(null)

onMounted(() => {
  selectedPantry.value = localStorage.getItem('selectedPantry')
})

const inventoryHref = computed(() =>
  selectedPantry.value ? `/tabs/inventory/${selectedPantry.value}` : undefined
)

const purchaseHref = computed(() =>
  selectedPantry.value ? `/tabs/purchase/${selectedPantry.value}` : undefined
)
</script>

<style scoped>
.tabs {
  --background: #fff;
  --color: #000;
  --color-selected: #2ea15d;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, .06);
}
</style>
