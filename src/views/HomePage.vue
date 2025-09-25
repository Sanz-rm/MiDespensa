<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Productos</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div style="display:flex; gap:20px; flex-wrap:wrap;">
        <div v-for="(item, i) in itemsWithImage" :key="i" style="text-align:center;">
          <img :src="`/src/assets/img/products/${item.image}`" :alt="item.name" style="width:120px; height:auto;" />
          <p>{{ item.name }} ({{ item.units }})</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/vue'
import productsMap from '@/config/products.json'
import type { Item } from '@/models/item'
import type { ItemWithImage } from '@/models/itemWithImage'

const items: Item[] = [
  { name: 'Platano de Canarias', units: 6, pantryCode: 'P001', locationId: 'Nevera' },
  { name: 'platanos verdes', units: 4, pantryCode: 'P001', locationId: 'Otro' },
  { name: 'Manzana Fuji', units: 3, pantryCode: 'P001', locationId: 'Otro' },
  { name: 'Lomo de salmon', units: 3, pantryCode: 'P001', locationId: 'Nevera' },
  { name: 'Sel', units: 1, pantryCode: 'P001', locationId: 'Otro' },
  { name: 'Salmon', units: 1, pantryCode: 'P001', locationId: 'Congelador' }
]

const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const keys = Object.keys(productsMap) as Array<keyof typeof productsMap>

const findImageForName = (name: string): string | null => {
  const n = normalize(name)
  let bestKey: keyof typeof productsMap | null = null
  let bestLen = -1
  for (const key of keys) {
    const nk = normalize(String(key))
    if (n.includes(nk) && nk.length > bestLen) {
      bestKey = key
      bestLen = nk.length
    }
  }
  return bestKey ? productsMap[bestKey] : null
}

const itemsWithImage: ItemWithImage[] = items.map(item => ({
  ...item,
  image: findImageForName(item.name) ?? 'default.png'
}))
</script>
