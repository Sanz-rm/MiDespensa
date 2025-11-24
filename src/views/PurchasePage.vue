<template>
  <ion-page>
    <ion-header class="rounded-header">
      <ion-toolbar class="back-toolbar">
        <ion-buttons slot="start">
          <ion-button :routerLink="{ name: 'home' }" routerDirection="root" fill="clear">
            <ion-icon :icon="arrowBackOutline" style="font-size:28px;" />
          </ion-button>
        </ion-buttons>
        <ion-title>Compra de {{ props.name }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding pantry-content">
      <!-- Acciones START-->
      <div class="actions">
        <ion-searchbar v-model="search" placeholder="Buscar producto…" :debounce="150" show-clear-button="focus"/>
        <ion-button color="danger" expand="block" :disabled="loading || !items.length" @click="showConfirmClear = true">
          <ion-icon :icon="trashOutline" slot="start" />
          Vaciar compra
        </ion-button>
      </div>
      <!-- Acciones END-->

      <!-- Loading START-->
      <div v-if="loading" class="loading-box">
        <ion-spinner name="crescent" style="transform:scale(2);"></ion-spinner>
      </div>
      <!-- Loading END-->

      <!-- Productos de la despensa seleccionada (en compra) -->
      <div v-if="!loading && itemsFiltered.length" class="list-cards">
        <div v-for="item in itemsFiltered" :key="item.id" class="item-row">
          <img class="icon" :src="`${item.imageUrl}`" :alt="item.name" />
          <div class="info">
            <p class="name">{{ item.name }}</p>
            <p class="units">{{ item.quantity }} {{ getMeasurementUnit(item.unit, item.quantity) }}</p>
          </div>
          <ion-button class="trash" color="danger" fill="clear" size="small" aria-label="Quitar de la compra"
            @click="deleteItemToPurchase(item.id)">
            <ion-icon :icon="trashOutline" />
          </ion-button>
        </div>
      </div>
      <div v-else-if="!loading" class="empty">
        <p>No hay productos en la compra.</p>
      </div>

      <!-- Pop up confirmar salir/eliminar despensa START -->
      <ConfirmPopup
        v-model="showConfirmClear"
        title="Vaciar compra"
        message="Se eliminarán todos los productos de la lista de compra. Esta acción no se puede deshacer. ¿Quieres continuar?"
        confirmLabel="Sí, vaciar"
        cancelLabel="Cancelar"
        @confirm="clearPurchase"
      />
      <!-- Pop up confirmar salir/eliminar despensa END -->

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonContent, IonSpinner, IonToolbar, IonButtons, IonButton, IonIcon, IonTitle, IonSearchbar, toastController, alertController } from '@ionic/vue'
import { arrowBackOutline, trashOutline } from 'ionicons/icons'
import type { Item } from '@/models/item'
import { onMounted, onBeforeUnmount, ref, computed} from 'vue'
import {
  collection, query, where, updateDoc, doc, getDoc, onSnapshot, type Unsubscribe,
  writeBatch,
  orderBy
} from 'firebase/firestore'
import { getImageFirstLetter, getMeasurementUnit } from '@/composables/itemUtils'
import { db } from '@/firebase'
import ConfirmPopup from '@/components/ui/ConfirmPopup.vue';


const props = defineProps<{ code: string; name: string }>()
console.log('Codigo y nombre de la despensa:', props.code, props.name)

const loading = ref<boolean>(false)
const search = ref<string>('')

//Estado popup confirmación eliminar/salir despens
const showConfirmClear = ref(false)

let stop: Unsubscribe | null = null
// Normaliza: quita acentos y pasa a minúsculas
const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()

const items = ref<Item[]>([])
const itemsFiltered = computed(() => {
  const q = norm(search.value)
  return items.value.filter(it =>
    it.inPurchase && (!q || norm(it.name).includes(q))
  )
})

// Lista de productos en compra con imagen y filtro por nombre
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
    where('inPurchase', '==', true),
    orderBy('name','asc')
  )
  stop = onSnapshot(
    q,
    snap => {
      items.value = snap.docs.map(d => {
        const item = d.data() as any
        return {
          id: String(d.id),
          name: String(item.name ?? ''),
          quantity: Number(item.quantity ?? 1),
          unit: String(item.unit ?? 'Unidad'),
          pantryCode: String(item.pantryCode ?? pantryCode),
          locationId: String(item.locationId ?? null),
          inPurchase: Boolean(item.inPurchase ?? false),
          imageUrl: String(item.imageUrl ?? getImageFirstLetter(String(item.name ?? ''))),
          notePurchase: String(item.notePurchase ?? '')
        } as Item
      })
      console.log("items obtenidos: ", items.value)
      loading.value = false
    },
    // Si falla suscripción/lectura
    async err => {
      console.error('Error al recuperar los items:', err)
      loading.value = false
      await showErrorToast('Error al cargar los productos de la compra.')
    }
  )
}

// Quitar un item de la compra
async function deleteItemToPurchase(idItem: string) {
  try {
    if (!idItem) return
    const ref = doc(db, 'items', idItem)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      console.log('No existe el item:', idItem)
      return
    }
    await updateDoc(ref, { inPurchase: false })
  } catch (err) {
    console.error('Error al quitar de la compra:', err)
    await showErrorToast('No se pudo quitar el producto de la compra.')
  }
}

// Vaciar compra (poner inPurchase=false a todos los productos de la compra)
async function clearPurchase() {
  try {
    if (!items.value.length) return
    const batch = writeBatch(db)
    for (const it of items.value) {
      batch.update(doc(db, 'items', it.id), { inPurchase: false })
    }
    await batch.commit()
  } catch (err) {
    console.error('Error al vaciar la compra:', err)
    await showErrorToast('No se pudo vaciar la compra.')
  }
}

function openConfirmClear() {
  if (!items.value.length || loading.value) return
  showConfirmClear.value = true
}

function cancelClear() {
  showConfirmClear.value = false
}

async function confirmClear() {
  showConfirmClear.value = false
  await clearPurchase()
}


// Muestra un toast rojo para errores (update o select)
async function showErrorToast(message: string) {
  const toast = await toastController.create({
    message,
    duration: 2000,
    color: 'danger',
    position: 'bottom'
  })
  await toast.present()
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
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
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
