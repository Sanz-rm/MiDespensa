<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />

      <ion-tab-bar slot="bottom" class="tabs">
        <ion-tab-button tab="inventory" :href="`/tabs/${code}/${name}/inventory`" routerDirection="root">
          <ion-icon :icon="cubeOutline" />
          <ion-label>Inventario</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="purchase" :href="`/tabs/${code}/${name}/purchase`" routerDirection="root"
          class="tab-button-purchase">
          <ion-icon :icon="cartOutline" />
          <ion-label>Compra</ion-label>

          <ion-badge v-if="purchaseCount > 0" class="tab-badge">
            {{ purchaseCount }}
          </ion-badge>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonTabs,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonBadge
} from '@ionic/vue'
import { cubeOutline, cartOutline } from 'ionicons/icons'
import { computed, ref, provide } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const code = computed(() => String(route.params.code ?? ''))
const name = computed(() => String(route.params.name ?? ''))

// 🔹 Contador compartido
const purchaseCount = ref(0)
provide('purchaseCount', purchaseCount)
</script>

<style scoped>
.tabs {
  --background: #fff;
  --color: #000;
  --color-selected: #2ea15d;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, .06);
}

.tabs :deep(ion-tab-button.tab-selected),
.tabs :deep(ion-tab-button.tab-selected ion-label) {
  font-weight: 700;
}
.tab-button-purchase {
  position: relative;
}

.tab-badge {
  position: absolute;
  top: 4px;
  right: 10px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: #2ea15d;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  padding: 0;
}

</style>
