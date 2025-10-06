<template>
  <ion-page>
    <ion-header class="rounded-header">
      <ion-toolbar class="back-toolbar">
        <ion-buttons slot="start">
          <ion-button :routerLink="{ name: 'home' }" routerDirection="root" fill="clear">
            <ion-icon :icon="arrowBackOutline" style="font-size:28px;" />
          </ion-button>
        </ion-buttons>
        <ion-title>{{ props.name }} Compra</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding pantry-content">
      <div class="actions">
        <ion-searchbar
          v-model="search"
          placeholder="Buscar producto…"
          :debounce="150"
          show-clear-button="focus"
        />
        <ion-button
          color="danger"
          expand="block"
          :disabled="loading || !items.length"
          @click="clearPurchase()"
        >
          <ion-icon :icon="trashOutline" slot="start" />
          Vaciar compra
        </ion-button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-box">
        <ion-spinner name="crescent" style="transform:scale(2);"></ion-spinner>
      </div>

      <!-- Productos de la despensa seleccionada (en compra) -->
      <div v-if="!loading && filteredItemsWithImage.length" class="list-cards">
        <div
          v-for="(item, i) in filteredItemsWithImage"
          :key="i"
          class="item-row"
        >
          <img class="icon" :src="`/img/products/${item.image}`" :alt="item.name" />
          <div class="info">
            <p class="name">{{ item.name }}</p>
            <p class="units">Cantidad: {{ item.units }}</p>
          </div>
          <ion-button
            class="trash"
            color="danger" 
            fill="clear"
            size="small"
            aria-label="Quitar de la compra"
            @click="deleteItemToPurchase(item.id)"
          >
            <ion-icon :icon="trashOutline" />
          </ion-button>
        </div>
      </div>

      <div v-else-if="!loading" class="empty">
        <p>No hay productos en la compra.</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonContent, IonSpinner, IonToolbar, IonButtons, IonButton, IonIcon, IonTitle, IonSearchbar
} from '@ionic/vue'
import { arrowBackOutline, trashOutline } from 'ionicons/icons'
import type { Item } from '@/models/item'
import { onMounted, onBeforeUnmount, ref } from 'vue'
import {
  collection, query, where, updateDoc, doc, getDoc, onSnapshot, type Unsubscribe,
  writeBatch
} from 'firebase/firestore'
import { db } from '@/firebase'
import { showItem } from '@/composables/showItem'

const props = defineProps<{ code: string; name: string }>()
console.log('Codigo y nombre de la despensa:', props.code, props.name)

const loading = ref<boolean>(false)
const search  = ref<string>('')

let stop: Unsubscribe | null = null
const items = ref<Item[]>([])

// Usa el composable (no re-declarar abajo)
const { filteredItemsWithImage } = showItem(items, search)

onMounted(() => {
  getPurchaseItems(props.code)
})

// Al cerrar la ventana dejaremos de escuchar a firestore
onBeforeUnmount(() => stop?.())

// Recuperamos los items de la despensa seleccionada (solo los que están en compra)
async function getPurchaseItems(pantryCode: string) {
  loading.value = true
  const q = query(
    collection(db, 'items'),
    where('pantryCode', '==', pantryCode),
    where('inPurchase', '==', true)
  )
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
      console.error('Error al recuperar los items:', err)
      loading.value = false
    }
  )
}

// Quitar un item de la compra
async function deleteItemToPurchase(idItem: string) {
  if (!idItem) return
  const ref = doc(db, 'items', idItem)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    console.log('No existe el item:', idItem)
    return
  }
  await updateDoc(ref, { inPurchase: false })
}

// Vaciar compra (poner inPurchase=false a todos los productos de la compra)
async function clearPurchase() {
  if (!items.value.length) return
  const batch = writeBatch(db)
  for (const it of items.value) {
    batch.update(doc(db, 'items', it.id), { inPurchase: false })
  }
  await batch.commit()
}
</script>

<style scoped>
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

/* Acciones */
.actions {
  display: grid;
  gap: 12px;
  margin-bottom: 8px;
}

/* Lista estilo cards en fila */
.list-cards {
  display: grid;
  gap: 12px;
}

/* Fila de item */
.item-row {
  display: grid;
  grid-template-columns: 40px 1fr auto;
  align-items: center;
  gap: 12px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #eef2f4;
  box-shadow: 0 2px 10px rgba(0,0,0,0.03);
  padding: 10px 12px;
}

.icon {
  width: 36px;
  height: 36px;
  object-fit: contain;
}

.info .name {
  margin: 0;
  font-weight: 700;
  font-size: 14px;
  color: #111827;
}

.info .units {
  margin: 2px 0 0;
  font-size: 12px;
  color: #6b7280;
}

.trash {
  --padding-start: 6px;
  --padding-end: 6px;
}

.empty {
  text-align: center;
  opacity: .7;
  padding: 24px 0;
}

.loading-box {
  display: grid;
  place-content: center;
  min-height: 40vh;
}
</style>
