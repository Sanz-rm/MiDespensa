<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />

      <ion-tab-bar slot="bottom" class="tabs">
        <ion-tab-button
          tab="inventory"
          :href="`/tabs/${code}/${name}/inventory`"
          routerDirection="root"
        >
          <ion-icon :icon="cubeOutline" />
          <ion-label>Inventario</ion-label>
        </ion-tab-button>

        <ion-tab-button
          tab="purchase"
          :href="`/tabs/${code}/${name}/purchase`"
          routerDirection="root"
        >
          <ion-icon :icon="cartOutline" />
          <ion-label>Compra</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/vue'
import { cubeOutline, cartOutline } from 'ionicons/icons'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const code = computed(() => String(route.params.code ?? ''))
const name = computed(() => String(route.params.name ?? ''))
</script>


<style scoped>
.tabs {
  --background: #fff;
  --color: #000;
  --color-selected: #2ea15d;
  box-shadow: 0 -2px 8px rgba(0,0,0,.06);
}
.tabs :deep(ion-tab-button.tab-selected),
.tabs :deep(ion-tab-button.tab-selected ion-label) {
  font-weight: 700;
}
</style>
