<template>
  <ion-page>
    <ion-header class="rounded-header">
      <ion-toolbar class="back-toolbar">
        <ion-buttons slot="start">
          <ion-button :routerLink="{ name: 'home' }" routerDirection="root" fill="clear">
            <ion-icon :icon="arrowBackOutline" style="font-size:28px;" />
          </ion-button>
        </ion-buttons>
        <ion-title>{{ props.name }} Inventario</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding pantry-content">
      <!-- Buscador -->
      <div class="actions">
        <ion-searchbar
          v-model="search"
          placeholder="Buscar producto…"
          :debounce="150"
          show-clear-button="focus"
        />
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-box">
        <ion-spinner name="crescent" style="transform:scale(2);" />
      </div>

      <!-- Productos de la despensa seleccionada -->
      <div v-if="!loading && filteredItemsWithImage.length" class="items-grid">
        <div v-for="(item, i) in filteredItemsWithImage" :key="i" class="item-card">
          <!-- Badge EN COMPRA -->
          <span v-if="item.inPurchase" class="badge-purchase">En compra</span>

          <img :src="`/img/products/${item.image}`" :alt="item.name" />
          <p class="item-name">{{ item.name }}</p>
          <p class="item-units">Cantidad: {{ item.units }}</p>

          <div class="card-actions">
            <ion-button
              size="small"
              color="success"
              class="btn-add"
              :disabled="item.inPurchase || adding[item.id]"
              @click="addItemToPurchase(item.id)"
            >
              <ion-icon :icon="cartOutline" slot="start" />
              {{ item.inPurchase ? 'En compra' : 'Añadir a compra' }}
            </ion-button>
          </div>
        </div>
      </div>

      <div v-else-if="!loading" class="empty">
        <p>No hay productos.</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonContent, IonSpinner, IonToolbar, IonButtons, IonButton, IonIcon, IonTitle, IonSearchbar
} from '@ionic/vue'
import { arrowBackOutline, cartOutline } from 'ionicons/icons'
import type { Item } from '@/models/item'
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { collection, query, where, updateDoc, doc, getDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import { db } from '@/firebase'
import { showItem } from '@/composables/showItem'

const props = defineProps<{ code: string; name: string }>()
console.log('Codigo y nombre de la despensa:', props.code, props.name)

const loading = ref<boolean>(false)
const search  = ref<string>('')

let stop: Unsubscribe | null = null
const items = ref<Item[]>([])
const adding = ref<Record<string, boolean>>({}) // para deshabilitar el botón mientras se añade

// Reutilizamos métodos de presentación (imagen + filtro por nombre)
const { filteredItemsWithImage } = showItem(items, search)

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
      loading.value = false
    },
    err => {
      console.error('Error al recuperar los items:', err)
      loading.value = false
    }
  )
}

// Añadir a compra desde la card
async function addItemToPurchase(idItem: string) {
  if (!idItem || adding.value[idItem]) return
  try {
    adding.value = { ...adding.value, [idItem]: true }
    const ref = doc(db, 'items', idItem)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      console.log('No existe el item:', idItem)
      return
    }
    await updateDoc(ref, { inPurchase: true })
    // onSnapshot actualizará automáticamente el estado de la UI (badge + botón)
  } finally {
    adding.value = { ...adding.value, [idItem]: false }
  }
}
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

ion-header.rounded-header ion-buttons ion-button { --color: #fff; }
ion-header.rounded-header ion-icon { color: #fff; }
ion-header.rounded-header ion-title { color: #fff; font-weight: 700; }

/* Acciones (buscador) */
.actions { display: grid; gap: 12px; margin-bottom: 8px; }

/* Productos */
.items-grid {
  margin-top: 8px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 14px;
}

.item-card {
  position: relative;
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
  margin: 2px 0 8px;
  font-size: 12px;
  color: #6b7280;
}

/* Botón dentro de la card */
.card-actions {
  display: flex;
  justify-content: center;
}

/* Badge “En compra” */
.badge-purchase {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #f59e0b; /* ámbar para destacar */
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 4px 6px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,.15);
}

/* Loading */
.loading-box {
  display: grid;
  place-content: center;
  min-height: 40vh;
}

.empty {
  text-align: center;
  opacity: .7;
  padding: 24px 0;
}

/* Color personalizado para el botón de añadir a compra */
.btn-add {
  --background: #2ea15d;
  --background-hover: #279150;
  --background-activated: #228447;
  --color: #fff;
  border-radius: 8px;
  font-weight: 600;
  text-transform: none;
}

</style>
