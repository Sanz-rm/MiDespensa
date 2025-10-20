<template>
  <ion-page>
    <ion-header class="rounded-header">
      <ion-toolbar class="back-toolbar">
        <ion-buttons slot="start">
          <ion-button :routerLink="{ name: 'home' }" routerDirection="root" fill="clear">
            <ion-icon :icon="arrowBackOutline" style="font-size:28px;" />
          </ion-button>
        </ion-buttons>
        <ion-title>Inventario de {{ props.name }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding pantry-content">
      <!-- Buscador START -->
      <div class="actions">
        <ion-searchbar v-model="search" placeholder="Buscar producto…" :debounce="150" show-clear-button="focus" />
      </div>
      <!-- Buscador END -->

      <!-- Loading START -->
      <div v-if="loading" class="loading-box">
        <ion-spinner name="crescent" style="transform:scale(2);" />
      </div>
      <!-- Loading END -->

      <!-- Productos de la despensa seleccionada START -->
      <div v-if="!loading && filteredItemsWithImage.length" class="items-grid">
        <div v-for="item in filteredItemsWithImage" :key="item.id" class="item-card">
          <ion-button class="delete-btn" fill="clear" size="small" aria-label="Eliminar producto"
            @click="deleteItemFromPantry(item)">
            <ion-icon :icon="trashOutline" />
          </ion-button>
          <img :src="`/img/products/${item.image}`" :alt="item.name" />
          <p class="item-name">{{ item.name }}</p>
          <p class="item-units">Cantidad: {{ item.units }}</p>

          <div class="card-actions">
            <ion-button size="small" :class="item.inPurchase ? 'btn-remove' : 'btn-add'"
              @click="togglePurchaseState(item)">
              <ion-icon :icon="cartOutline" slot="start" />
              {{ item.inPurchase ? 'Quitar de compra' : 'Añadir a compra' }}
            </ion-button>
          </div>
        </div>
      </div>
      <!-- Productos de la despensa seleccionada END -->

      <!-- Sin productos de la despensa seleccionada START -->
      <div v-else-if="!loading" class="empty">
        <p>No hay productos.</p>
      </div>
      <!-- Sin productos de la despensa seleccionada END -->

      <!-- Botón flotante START -->
      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button @click="openCreateModal" aria-label="Crear producto" class="add-button">
          <ion-icon :icon="addOutline" />
        </ion-fab-button>
      </ion-fab>
      <!-- Botón flotante END -->

      <!-- Modal crear producto START -->
      <ion-modal :is-open="isCreateOpen" @didDismiss="closeCreateModal">
        <!-- Header modal START -->
        <ion-header>
          <ion-toolbar>
            <ion-title>Crear producto</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeCreateModal">Cerrar</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <!-- Header modal END -->

        <!-- Contenido modal START -->
        <ion-content class="ion-padding">
          <ion-list>
            <ion-item>
              <ion-label position="stacked">Nombre del producto</ion-label>
              <ion-input
                v-model="newProductName"
                placeholder="Ej. Leche, Huevos, Arroz"
                @keyup.enter="confirmCreate"
                autofocus
              />
            </ion-item>
          </ion-list>

          <div style="display:flex; gap:10px; margin-top:16px;">
            <ion-button expand="block" fill="clear" @click="closeCreateModal">
              Cancelar
            </ion-button>
            <ion-button expand="block" @click="confirmCreate">
              Crear
            </ion-button>
          </div>

          <!-- PRODUCTOS CREADOS PARA AÑADIR AL INVENTARIO START -->
          <div class="suggested-wrapper">
            <h3 class="suggested-title">Añade productos a tu despensa</h3>

            <!-- Render directo del mapa de los productos que no estan en la despensa START -->
            <div v-if="Object.keys(newItemsMap).length" class="suggested-grid">
              <div
                v-for="(img, name) in newItemsMap"
                :key="name"
                class="suggested-card"
              >
                <img :src="`/img/products/${img}`" :alt="name" class="suggested-img" />
                <p class="suggested-name">{{ name }}</p>
              </div>
            </div>
            <!-- Render directo del mapa de los productos que no estan en la despensa END -->

            <p v-else class="empty-suggested">No hay productos disponibles</p>
          </div>
          <!-- PRODUCTOS CREADOS PARA AÑADIR AL INVENTARIO END -->
        </ion-content>
        <!-- Contenido modal END -->
      </ion-modal>
      <!-- Modal crear producto START -->

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonContent, IonSpinner, IonToolbar, IonButtons,
  IonButton, IonIcon, IonTitle, IonSearchbar, toastController, IonFab, IonFabButton,
  IonModal, IonInput, IonItem, IonList, IonLabel
} from '@ionic/vue'
import { arrowBackOutline, cartOutline, trashOutline, addOutline } from 'ionicons/icons'
import type { Item } from '@/models/item'
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { collection, query, where, updateDoc, doc, getDocs, writeBatch, increment, onSnapshot, limit, type Unsubscribe } from 'firebase/firestore'
import { db } from '@/firebase'
import { showItem, showItemsNews } from '@/composables/showItem'

const props = defineProps<{ code: string; name: string }>()
console.log('Codigo y nombre de la despensa:', props.code, props.name)

const loading = ref<boolean>(false)
const search = ref<string>('')

let stop: Unsubscribe | null = null
const items = ref<Item[]>([])

// Lista de productos en inventario con imagen y filtro por nombre
const { filteredItemsWithImage } = showItem(items, search)
const pantryDocId = ref<string | null>(null)

const newItemsMap = ref<Record<string, string>>({})
onMounted(() => {
  getPantryItems(props.code)
})

// Al cerrar la ventana dejaremos de escuchar a firestore
onBeforeUnmount(() => stop?.())

// Estado del modal de creación
const isCreateOpen = ref(false)
// Modelo del input del modal
const newProductName = ref('')

// Abrimos el modal (y opcionalmente preparamos sugerencias)
function openCreateModal() {
  // Si quieres preparar sugerencias/pre-cargar datos, reaprovechamos tu función
  showItemsProps()
  isCreateOpen.value = true
}

// Cerramos el modal y limpiamos
function closeCreateModal() {
  isCreateOpen.value = false
  newProductName.value = ''
}

// Confirmamos creación desde el modal
async function confirmCreate() {
  await addItemFromPantry(newProductName.value)
  // Si la creación fue válida, cerramos (addItemFromPantry ya muestra toasts)
  if (newProductName.value.trim()) {
    closeCreateModal()
  }
}

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
      items.value = items.value.sort((a, b) => a.name.localeCompare(b.name))
      loading.value = false
    },
    async err => {
      console.error('Error al recuperar los items:', err)
      loading.value = false
      await showErrorToast('Error al cargar los productos de la despensa.')
    }
  )
}

// Agregamos el item a la compra (o lo quitamos si ya estaba)
async function togglePurchaseState(item: Item) {
  try {
    const ref = doc(db, 'items', item.id)
    await updateDoc(ref, { inPurchase: !item.inPurchase })
  } catch (err) {
    console.error('Error al actualizar inPurchase:', err)
    await showErrorToast(`No se pudo actualizar el estado de ${item.name}.`)
  }
}

// Mostramos los items disponibles para agregar
function showItemsProps() {
  newItemsMap.value = showItemsNews(items)
   console.log('Productos a mostrar JSON: ', newItemsMap.value)
   //addItemFromPantry('Sal')
}


// Añade un nuevo item a la despensa
async function addItemFromPantry(nameItem: string) {
  const name = (nameItem ?? '').trim()
  if (!name) {
    await showErrorToast('Escribe un nombre de producto.')
    return
  }

  loading.value = true
  try {
    // Comprobar que no exista ya un item con ese nombre en la despensa
    const dupQ = query(
      collection(db, 'items'),
      where('pantryCode', '==', props.code),
      where('name', '==', name)
    )
    const dupSnap = await getDocs(dupQ)
    if (!dupSnap.empty) {
      await showErrorToast(`El producto ${name} ya existe en la despensa.`)
      return
    }
    // Agregamos el item y actualizamos el totalItems de la despensa
    const batch = writeBatch(db)
    const newItemRef = doc(collection(db, 'items'))
    batch.set(newItemRef, {
      name,
      pantryCode: props.code,
      units: 1,
      inPurchase: false,
      locationId: 'fi4aM1bw8qP44Gu6JFwl',
    })

    const pantryRef = await getPantryRefByCode()
    batch.update(pantryRef, { totalItems: increment(1) })

    await batch.commit()
    await showSuccessToast(`Producto ${name} añadido.`)
  } catch (err) {
    console.error('Error al añadir producto:', err)
    await showErrorToast(`No se pudo añadir el producto ${name}.`)
  } finally {
    loading.value = false
  }
}

// Elimina un item de la despensa y actualiza totalItems de la despensa
async function deleteItemFromPantry(item: Item) {
  try {
    if (!item.id) return

    const batch = writeBatch(db)
    const itemRef = doc(db, 'items', item.id)
    batch.delete(itemRef)

    const pantryRef = await getPantryRefByCode()
    batch.update(pantryRef, { totalItems: increment(-1) })

    await batch.commit()
    await showSuccessToast(`Producto ${item.name} eliminado.`)
  } catch (err) {
    console.error('Error al eliminar producto:', err)
    await showErrorToast(`No se pudo eliminar el producto ${item.name}.`)
  }
}

// Obtenemos el identificador del documento de la despensa actual
async function getPantryRefByCode() {
  if (pantryDocId.value) return doc(db, 'pantries', pantryDocId.value)

  const q = query(
    collection(db, 'pantries'),
    where('code', '==', props.code),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) throw new Error(`No existe la despensa con code ${props.code}`)

  pantryDocId.value = snap.docs[0].id
  return snap.docs[0].ref
}

// Muestra un toast verde para confirmaciones
async function showSuccessToast(message: string) {
  const toast = await toastController.create({
    message,
    duration: 1800,
    color: 'success',
    position: 'bottom'
  })
  await toast.present()
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

/* Acciones (buscador) */
.actions {
  display: grid;
  gap: 12px;
  margin-bottom: 8px;
}

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
  padding: 14px;
  border-radius: 12px;
  border: 1px solid #eef2f4;
  background: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
}

.item-card img {
  width: 100%;
  height: 80px;
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

.delete-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  --padding-start: 6px;
  --padding-end: 6px;
  --padding-top: 6px;
  --padding-bottom: 6px;
  --background: transparent;
  --color: #ef4444;
  z-index: 2;
}

.delete-btn:hover,
.delete-btn:focus {
  --color: #dc2626;
}

/* Botón dentro de la card */
.card-actions {
  display: flex;
  justify-content: center;
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

/* Color personalizado para el botón de quitar de compra */
.btn-remove {
  --background: #dc2626;
  --background-hover: #b91c1c;
  --background-activated: #991b1b;
  --color: #fff;
  border-radius: 8px;
  font-weight: 600;
  text-transform: none;
}

.add-button{
  --background: #2ea15d;
}

/* Estilos del listado informativo en el modal */
.suggested-wrapper{
  margin-top: 24px;
}
.suggested-title{
  margin: 0 0 10px 0;
  font-size: 16px;
  font-weight: 700;
}
.suggested-grid{
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}
.suggested-card{
  display: grid;
  justify-items: center;
  text-align: center;
  padding: 12px;
  border: 1px solid #eef2f4;
  border-radius: 12px;
  background: #fff;
}
.suggested-img{
  width: 80px;
  height: 80px;
  object-fit: contain;
  margin-bottom: 8px;
}
.suggested-name{
  font-weight: 600;
  font-size: 14px;
  margin: 0 0 4px 0;
}
.suggested-note{
  font-size: 12px;
  opacity: .8;
  margin: 0;
}
.empty-suggested{
  opacity: .7;
  margin-top: 8px;
}
</style>
