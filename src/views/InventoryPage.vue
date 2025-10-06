<template>
  <ion-page>
    <ion-header class="rounded-header">
      <ion-toolbar class="back-toolbar">
        <ion-buttons slot="start">
          <ion-button :routerLink="{ name: 'home' }" routerDirection="root" fill="clear">
            <ion-icon :icon="arrowBackOutline" style="font-size:28px;" />
          </ion-button>
        </ion-buttons>
        <ion-title>{{ props.name }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding pantry-content">
      <!-- Mensaje de error -->
      <div v-if="pantryError" class="error-box">
        <span>{{ pantryError }}</span>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-box">
        <ion-spinner name="crescent" style="transform:scale(2);"></ion-spinner>
      </div>

      <!-- Productos de la despensa seleccionada -->
      <div v-if="!loading && itemsWithImage.length" class="items-grid">
        <div v-for="(item, i) in itemsWithImage" :key="i" class="item-card">
          <img :src="`/img/products/${item.image}`" :alt="item.name" />
          <p class="item-name">{{ item.name }}</p>
          <p class="item-units">{{ item.units }} uds</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonContent, IonSpinner, IonToolbar, IonButtons, IonButton, IonIcon, IonTitle } from '@ionic/vue'
import { arrowBackOutline} from 'ionicons/icons'
import productsMap from '@/config/products.json'
import type { Item } from '@/models/item'
import type { ItemWithImage } from '@/models/itemWithImage'
import { onMounted, onBeforeUnmount, ref, computed } from 'vue'
import { collection, query, where, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import { db } from '@/firebase'

const props = defineProps<{ code: string; name: string }>()
console.log('Codigo y nombre de la despensa:', props.code, props.name)

const error = ref<string | null>(null)
const pantryError = ref<string | null>(null)
const loading = ref<boolean>(false)

let stop: Unsubscribe | null = null
const items = ref<Item[]>([])

onMounted(() => {
  getPantryItems(props.code)
})

// Al cerrar la ventana dejaremos de escuchar a firestore
onBeforeUnmount(() => stop?.())

// Recuperamos los items de la despensa seleccionada
async function getPantryItems(pantryCode: string) {
  loading.value = true
  const q = query(collection(db, 'items'), where('pantryCode', '==', pantryCode))
  stop = onSnapshot(
    q,
    snap => {
      items.value = snap.docs.map(d => {
        const item = d.data() as any
        return {
          id: String(d.id),
          name: String(item.name ?? ''),
          units: Number(item.units ?? 0),
          pantryCode: String(item.pantryCode ?? pantryCode),
          locationId: String(item.locationId ?? 'Otro'),
          inPurchase: Boolean(item.inPurchase ?? false)
        } as Item
      })
      console.log('Productos actuales:', items.value)
      loading.value = false
    },
    err => {
      error.value = err?.message ?? String(err)
      loading.value = false
    }
  )
}
// Devolveremos el item en minusculas y sin tildes
const normalize = (s: string) => {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

// Almacenamos en una lista todas las claves de propiedades
const keys = Object.keys(productsMap) as Array<keyof typeof productsMap>

/**
 * Obtenemos la imagen mas adecuada del item.
 * Normalizaremos nuestras claves e items para comprobar que clave coincide mejor con el item seleccionado.
 * Una vez obtenida la clave con mas coincidencia devolveremos el valor del nombre de la imagen a asociar.
 */
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
// Crearemos una nueva lista de Items pero le añadiremos el campo de imagen para poder mostrarlo correctamente
const itemsWithImage = computed<ItemWithImage[]>(() =>
  items.value.map(item => ({
    ...item,
    image: findImageForName(item.name) ?? 'default.png'
  }))
)
</script>

<style scoped>
/* Header */
ion-header.rounded-header {
  --background: #2ea15d;
  --ion-background-color: #2ea15d;
  --color: #fff;
  --box-shadow: none;
  background: #2ea15d !important;
  box-shadow: none !important;
  border: 0;
  padding: 0;
  overflow: visible;
}

.back-toolbar {
  --background: transparent;
  --border-width: 0;
  padding-inline: 4px;
}

ion-header.rounded-header ion-buttons ion-button {
  --color: #fff;
}

ion-header.rounded-header ion-icon {
  color: #fff;
}

ion-header.rounded-header ion-title {
  color: #fff;
  font-weight: 700;
}

/* Productos */
.items-grid {
  margin-top: 8px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 14px;
}

.item-card {
  text-align: center;
  padding: 10px;
  border-radius: 12px;
  border: 1px solid #eef2f4;
  background: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
}

.item-card img {
  width: 100%;
  height: 100px;
  object-fit: contain;
  display: block;
  margin: 0 auto 8px;
}

.item-name {
  margin: 0;
  font-weight: 700;
  font-size: 14px;
  color: #111827;
}

.item-units {
  margin: 2px 0 0;
  font-size: 12px;
  color: #6b7280;
}
</style>
