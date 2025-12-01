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
      <div v-if="!loading && itemsFiltered.length" class="items-grid">
        <div v-for="item in itemsFiltered" :key="item.id" class="item-card" @click="openInfoModal(item)">
          <ion-button class="delete-btn" fill="clear" size="small" aria-label="Eliminar producto"
            @click.stop="deleteItemFromPantry(item)">
            <ion-icon :icon="trashOutline" />
          </ion-button>
          <img :src="`${item.imageUrl}`" :alt="item.name" />
          <p class="item-name">{{ item.name }}</p>
          <p class="item-units">{{ item.quantity }} {{ getMeasurementUnit(item.unit, item.quantity) }}</p>

          <div class="card-actions">
            <ion-button size="small" :class="item.inPurchase ? 'btn-remove' : 'btn-add'"
              @click.stop="togglePurchaseState(item)">
              <ion-icon :icon="cartOutline" slot="start" />
              {{ item.inPurchase ? 'Quitar de compra' : 'Añadir a compra' }}
            </ion-button>
          </div>
        </div>
      </div>
      <!-- Productos de la despensa seleccionada END -->

      <!-- No hay coincidencia de productos START -->
      <div v-else-if="items.length && search" class="empty">
        <div class="empty-icon">
          <span class="material-icons">local_mall</span>
        </div>
        <p class="empty-title">No hay productos que coincidan con la búsqueda</p>
        <p class="empty-subtitle">¡Añádelo en tu inventario!</p>
      </div>
      <!-- No hay coincidencia de productos END -->

      <!-- Sin productos de la despensa seleccionada START -->
      <div v-else class="empty">
        <div class="empty-icon">
          <span class="material-icons">local_mall</span>
        </div>
        <p class="empty-title">No hay productos todavía</p>
        <p class="empty-subtitle">Crea o añade tu primer producto</p>
      </div>
      <!-- Sin productos de la despensa seleccionada END -->  

      <!-- Botón flotante START -->
      <ModalAddProduct :pantry-code="props.code" :items="items" view="inventory" />
      <!-- Botón flotante END -->

      <!-- Modal info producto START -->
      <ion-modal :is-open="isInfoOpen" css-class="product-info-modal" @didDismiss="closeInfoModal">
        <ion-content class="product-info-content" v-if="selectedItem">
          <div class="product-info-wrapper">
            <h3 class="info-title">INFORMACIÓN DE PRODUCTO</h3>

            <div class="info-product-block">
              <div class="info-product-image-wrapper" @click="pickImage(selectedItem)">
                <img
                  :src="selectedItem.imageUrl"
                  :alt="selectedItem.name"
                />
                <span class="material-icons info-product-icon">
                  add_photo_alternate
                </span>
              </div>
              <span class="info-product-name">{{ selectedItem.name }}</span>
            </div>


            <div class="info-form">
              <div class="info-row">
                <div class="info-field">
                  <label class="info-label">Cantidad</label>
                  <ion-input type="number" inputmode="numeric" v-model.number="editQuantity" class="info-input" />
                </div>

                <div class="info-field">
                  <label class="info-label">Unidad</label>
                  <ion-select interface="popover" v-model="editUnit" class="info-select">
                    <ion-select-option v-for="u in unitOptions" :key="u" :value="u">
                      {{ u }}
                    </ion-select-option>
                  </ion-select>
                </div>
              </div>

              <div class="info-row2">
                <div class="info-field">
                  <label class="info-label">Localización</label>
                  <ion-select interface="popover" v-model="editLocation" class="info-select" placeholder="Selecciona una localización">
                    <ion-select-option v-for="l in locations" :key="l.id" :value="l">
                      {{ l.name }}
                    </ion-select-option>
                  </ion-select>
                </div>
              </div>

              <div class="info-actions">
                <ion-button expand="block" fill="outline" class="btn-info-cancel" @click="closeInfoModal">
                  ✕ Cancelar
                </ion-button>
                <ion-button expand="block" class="btn-info-save" @click="saveItemInfo">
                  Guardar
                </ion-button>
              </div>
            </div>
          </div>
        </ion-content>
      </ion-modal>
      <!-- Modal info producto END -->

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonContent, IonSpinner, IonToolbar, IonButtons,
  IonButton, IonIcon, IonTitle, IonSearchbar,
  IonModal, IonInput, IonSelect, IonSelectOption
} from '@ionic/vue'
import { arrowBackOutline, cartOutline, trashOutline } from 'ionicons/icons'
import type { Item } from '@/models/item'
import type { Location } from '@/models/location'
import { onMounted, onBeforeUnmount, ref, computed } from 'vue'
import { collection, query, where, updateDoc, doc, getDocs, writeBatch, increment, onSnapshot, limit, type Unsubscribe, orderBy } from 'firebase/firestore'
import { db } from '@/firebase'
import { showToast } from '@/composables/showToast'
import { getMeasurementUnit } from '@/composables/itemUtils'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import ModalAddProduct from '@/components/layout/ModalAddProduct.vue'


const props = defineProps<{ code: string; name: string }>()
console.log('Codigo y nombre de la despensa:', props.code, props.name)

const loading = ref<boolean>(false)
const search = ref<string>('')

let stop: Unsubscribe | null = null
const items = ref<Item[]>([])

const locations = ref<Location[]>([])

// Normaliza: quita acentos y pasa a minúsculas
const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()

// Lista filtrada según el texto del searchbar
const itemsFiltered = computed(() => {
  const q = norm(search.value)
  if (!q) return items.value
  return items.value.filter(it => norm(it.name).includes(q))
})

// Lista de productos en inventario con imagen y filtro por nombre
const pantryDocId = ref<string | null>(null)

onMounted(() => {
  getPantryItems(props.code)
})

// Al cerrar la ventana dejaremos de escuchar a firestore
onBeforeUnmount(() => stop?.())

// Estado del modal de información
const isInfoOpen = ref(false)
const selectedItem = ref<Item | null>(null)

// Campos editables del modal
const editQuantity = ref<number | null>(null)
const editUnit = ref<string>()
const editLocation = ref<Location | null>(null)

const unitOptions = ['Unidad', 'Kilogramo', 'Gramo', 'Litro', 'Mililitro']

// refs para manejar la imagen pendiente de guardar
const pendingImageFile = ref<File | null>(null)
const pendingImagePublicId = ref<string | null>(null)

// Modal info producto
async function openInfoModal(item: Item) {
  selectedItem.value = item
  editQuantity.value = item.quantity
  editUnit.value = item.unit || 'Unidad'
  getLocations(item.locationId || null)
  isInfoOpen.value = true
}

// Cierra el modal de información y resetea los campos
function closeInfoModal() {
  isInfoOpen.value = false
  selectedItem.value = null
  editQuantity.value = null
  editUnit.value = 'Unidad'
  editLocation.value = null
}

async function getLocations(locationId: string | null) {
  loading.value = true
  const q = query(
    collection(db, 'locations'),
    orderBy('name', 'asc')
  )

  stop = onSnapshot(
    q,
    snap => {
      locations.value = snap.docs.map(d => {
        const loc = d.data() as any
        return {
          id: String(d.id),
          name: String(loc.name ?? ''),
        } as Location
      })

      editLocation.value =
        locations.value.find(l => l.id === locationId) ?? null

      loading.value = false
      console.log('locations obtenidas:', locations.value)
    },
    async err => {
      console.error('Error al obtener localizaciones:', err)
      loading.value = false
      await showToast('Error al cargar las localizaciones.', 'danger')
    }
  )
}
// Guarda los cambios del producto y sube la imagen solo si el usuario seleccionó una nueva antes de guardar
async function saveItemInfo() {
  if (!selectedItem.value || editQuantity.value == null) {
    await showToast('Rellena la cantidad antes de guardar.', 'danger')
    return
  }

  try {
    if (pendingImageFile.value && pendingImagePublicId.value) {
      const url = await uploadToCloudinary(pendingImageFile.value, pendingImagePublicId.value)
      if (!url) {
        await showToast('Error al subir la imagen a la nube.', 'danger')
        return
      }
      selectedItem.value.imageUrl = url
    }

    const refItem = doc(db, 'items', selectedItem.value.id)
    await updateDoc(refItem, {
      quantity: editQuantity.value,
      unit: editUnit.value,
      imageUrl: selectedItem.value.imageUrl,
      locationId: editLocation.value ? editLocation.value.id : null,
    })

    pendingImageFile.value = null
    pendingImagePublicId.value = null

    await showToast('Producto actualizado.', 'success')
    closeInfoModal()
  } catch (err) {
    await showToast('No se pudo actualizar el producto.', 'danger')
  }
}

// Obtiene una imagen de la cámara/galería y la deja solo en memoria como preview hasta que el usuario pulse Guardar
async function pickImage(item: Item) {
  try {
    const photo = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt,
      promptLabelHeader: 'Seleccionar imagen',
      promptLabelPhoto: 'Galería',
      promptLabelPicture: 'Cámara',
      promptLabelCancel: 'Cancelar',
    })

    if (!photo.dataUrl) return

    const response = await fetch(photo.dataUrl)
    const blob = await response.blob()

    const safeName = norm(item.name)
    const publicId = `${safeName}_${item.pantryCode}_${Date.now()}`

    const file = new File([blob], `${publicId}.jpg`, {
      type: blob.type || 'image/jpeg',
    })

    pendingImageFile.value = file
    pendingImagePublicId.value = publicId
    item.imageUrl = photo.dataUrl
  } catch (err) {
    await showToast('Cancelado o error al elegir imagen', 'danger')
  }
}

// Sube la imagen a Cloudinary y devuelve la URL
async function uploadToCloudinary(file: File, publicId: string): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', 'Productos_Galeria')
  formData.append('folder', 'productos_galeria')
  formData.append('public_id', publicId)
  formData.append('api_key', '962198993815698')

  const res = await fetch('https://api.cloudinary.com/v1_1/dpgqmi3zs/image/upload', {
    method: 'POST',
    body: formData,
  })

  const data = await res.json()
  return data.secure_url
}

// Recuperamos los items de la despensa seleccionada
async function getPantryItems(pantryCode: string) {
  loading.value = true
  const q = query(
    collection(db, 'items'),
    where('pantryCode', '==', pantryCode),
    orderBy('name', 'asc')
  );
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
          imageUrl: String(item.imageUrl ?? '')
        } as Item
      })
      loading.value = false
      console.log("items obtenidos: ", items.value)
    },
    async err => {
      console.error('Error al recuperar los items:', err)
      loading.value = false
      await showToast('Error al cargar los productos de la despensa.', 'danger')
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
    await showToast(`No se pudo actualizar el estado de ${item.name}.`, 'danger')
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
    await showToast(`Producto ${item.name} eliminado.`, 'success')
  } catch (err) {
    console.error('Error al eliminar producto:', err)
    await showToast(`No se pudo eliminar el producto ${item.name}.`, 'danger')
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
  right: 1px;
  --padding-start: 0;
  --padding-end: 0;
  --padding-top: 0;
  --padding-bottom: 0;
  --background: #ef4444;
  --background-hover: #dc2626;
  --background-activated: #b91c1c;
  --color: #ffffff;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

/* El círculo REAL debe aplicarse al elemento interno */
.delete-btn::part(native) {
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-btn ion-icon {
  --ionicon-stroke-width: 35px;
}

.delete-btn:hover,
.delete-btn:focus {
  --background: #dc2626;
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
  height: 33px;
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

.add-button {
  --background: #2ea15d;
}

.empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px 16px;
  color: #6b7280;
}

.empty-suggested {
  opacity: .7;
  margin-top: 10vh;
  text-align: center;
  align-items: center;
}

.empty-icon {
  width: 120px;
  height: 120px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  margin-bottom: 2px;
}

.empty-icon .material-icons {
  font-size: 78px;
  color: #374151;
}

.empty-title {
  margin: 0 0 4px;
  font-weight: 700;
  font-size: 18px;
  color: #111827;
}

.empty-subtitle {
  margin: 0;
  font-size: 17px;
  color: #3f4146;
  font-weight: 500;
}

/* MODAL INFO PRODUCTO */
.product-info-modal::part(content) {
  position: absolute;
  top: 20%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 360px;
  max-height: 70%;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
  background: #ffffff;
}

.product-info-content {
  --background: #ffffff;
}

.product-info-wrapper {
  padding: 18px 16px 20px;
}

.info-title {
  margin: 0 0 10px;
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 6%;
}

.info-product-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 12%;
}

/* wrapper de la imagen */
.info-product-image-wrapper {
  position: relative;
  width: 108px;
  height: 108px;
}

.info-product-image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* icono arriba a la derecha de la imagen */
.info-product-icon {
  position: absolute;
  top: 85px;
  right: 1px;
  font-size: 25px;
  background: #16a34a; /* opcional */
  border-radius: 50%;
  padding: 2px;
  color: #fff;
  pointer-events: none; /* para que el click vaya al div wrapper */
}

.info-product-name {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin-top: 4%;
}


.info-form {
  margin-top: 4px;
}

.info-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 18px;
}

.info-row2 {
  display: grid;
  grid-template-columns: 1fr;
  margin-bottom: 18px;
}

.info-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.info-input,
.info-select {
  --background: #f9fafb;
  --padding-start: 8px;
  --padding-end: 8px;
  --padding-top: 6px;
  --padding-bottom: 6px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  font-size: 14px;
}

.info-input,
.info-select {
  --background: #f9fafb;
  --padding-start: 8px;
  --padding-end: 8px;
  --padding-top: 6px;
  --padding-bottom: 6px;

  /* borde “normal” */
  --border-radius: 10px;
  --border-color: #e5e7eb;
  --border-width: 1px;
  --border-style: solid;

  /* >>> color de la barra de enfoque (la que ahora ves azul) <<< */
  --highlight-color-focused: #16a34a;
  --highlight-color: #16a34a;
  --highlight-color-valid: #16a34a;
  --highlight-height: 2px;

  font-size: 14px;
}


/* Botones inferiores */
.info-actions {
  display: flex;
  gap: 10px;
}

.btn-info-cancel {
  flex: 1;
  --background: #ffffff;
  --border-color: #16a34a;
  --color: #16a34a;
  --border-width: 1px;
  --box-shadow: none;
  font-weight: 600;
  text-transform: none;
  border-radius: 999px;
}

.btn-info-save {
  flex: 1;
  --background: #16a34a;
  --background-hover: #15803d;
  --background-activated: #166534;
  --color: #ffffff;
  font-weight: 600;
  text-transform: none;
  border-radius: 999px;
}
</style>
