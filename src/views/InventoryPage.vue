<template>
  <ion-page>
    <InventoryAndPurcharseHeader :title="`Inventario de ${props.name}`" backRouteName="home" />

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
        <div v-for="item in itemsFiltered" :key="item.id" class="item-card"
          :class="{ 'item-card-expiring': isExpiringSoon(item) }" @click="openInfoModal(item)">
          <!-- Botón mover -->
          <ion-button class="move-btn" fill="clear" size="small" aria-label="Mover producto"
            @click.stop="openMoveModal(item)">
            <ion-icon :icon="swapHorizontalOutline" />
          </ion-button>

          <!-- Botón eliminar -->
          <ion-button class="delete-btn" fill="clear" size="small" aria-label="Eliminar producto"
            @click.stop="deleteItemFromPantry(item)">
            <ion-icon :icon="trashOutline" />
          </ion-button>

          <img :src="getOptimizedUrl(item.imageUrl)" :alt="item.name"
            :class="{ 'img-galery': isImageGalery(item.imageUrl) }" />
          <p class="item-name">{{ item.name }}</p>

          <!-- Controles cantidad en card -->
          <div class="item-units">
            <ion-button fill="clear" size="small" class="qty-btn qty-btn-card"
              @click.stop="adjustItemQuantity(item, -1)">
              <span class="material-icons">remove</span>
            </ion-button>

            <span class="item-units-value">
              {{ item.quantity }} {{ getMeasurementUnit(item.unit, item.quantity) }}
            </span>

            <ion-button fill="clear" size="small" class="qty-btn qty-btn-card"
              @click.stop="adjustItemQuantity(item, 1)">
              <span class="material-icons">add</span>
            </ion-button>
          </div>

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
      <ModalAddProduct :pantry-code="props.code" :items="items" view="inventory" @willOpen="search = ''" />
      <!-- Botón flotante END -->

      <!-- Modal info producto START -->
      <ion-modal :is-open="isInfoOpen" css-class="product-info-modal" @didDismiss="closeInfoModal"
        :backdropDismiss="!savingItem" :canDismiss="!savingItem">
        <ion-content class="product-info-content" v-if="selectedItem">
          <div class="product-info-wrapper">
            <h3 class="info-title">INFORMACIÓN DE PRODUCTO</h3>

            <div class="info-product-block">
              <div class="info-product-image-wrapper" @click="!savingItem && pickImage(selectedItem)">
                <img :src="selectedItem.imageUrl" :alt="selectedItem.name" />
                <span class="material-icons info-product-icon">add_photo_alternate</span>
              </div>
              <span class="info-product-name">{{ selectedItem.name }}</span>
            </div>

            <div class="info-form">
              <div class="info-row">
                <div class="info-field">
                  <label class="info-label">Cantidad</label>
                  <div class="qty-inline">
                    <ion-button fill="clear" size="small" class="qty-btn qty-btn-modal qty-btn-minus qty-inline-btn"
                      @click="changeEditQuantity(-1)" :disabled="savingItem">
                      <span class="material-icons">remove</span>
                    </ion-button>

                    <ion-input type="number" inputmode="numeric" v-model.number="editQuantity"
                      class="info-input-exception qty-input qty-inline-input" :disabled="savingItem" />

                    <ion-button fill="clear" size="small" class="qty-btn qty-btn-modal qty-btn-plus qty-inline-btn"
                      @click="changeEditQuantity(1)" :disabled="savingItem">
                      <span class="material-icons">add</span>
                    </ion-button>
                  </div>
                </div>

                <div class="info-field">
                  <label class="info-label">Unidad</label>
                  <ion-select interface="popover" v-model="editUnit" class="info-select" :disabled="savingItem">
                    <ion-select-option v-for="u in unitOptions" :key="u" :value="u">
                      {{ u }}
                    </ion-select-option>
                  </ion-select>
                </div>
              </div>

              <div class="info-row2">
                <div class="info-field">
                  <label class="info-label">Localización</label>
                  <ion-select interface="popover" v-model="editLocation" class="info-select"
                    placeholder="Selecciona una localización" :disabled="savingItem">
                    <ion-select-option v-for="l in locations" :key="l.id" :value="l">
                      {{ l.name }}
                    </ion-select-option>
                  </ion-select>
                </div>
              </div>

              <!-- Caducidad (date picker nativo) -->
              <div class="info-row2">
                <div class="info-field">
                  <label class="info-label">Caducidad</label>
                  <ion-input type="date" class="info-input" v-model="editExpirationDateInput" :disabled="savingItem" />
                </div>
              </div>

              <div class="info-actions">
                <ion-button expand="block" fill="outline" class="btn-info-cancel" @click="closeInfoModal"
                  :disabled="savingItem">
                  <span class="material-icons">close</span> Cancelar
                </ion-button>

                <ion-button expand="block" class="btn-info-save" @click="saveItemInfo" :disabled="savingItem">
                  Guardar
                </ion-button>
              </div>
            </div>

            <!-- OVERLAY LOADER MODAL -->
            <div v-if="savingItem" class="modal-saving-overlay">
              <ion-spinner name="crescent" style="transform:scale(1.6);" />
              <p class="modal-saving-text">Guardando…</p>
            </div>
          </div>
        </ion-content>
      </ion-modal>
      <!-- Modal info producto END -->

      <!-- Modal mover producto START -->
      <ion-modal :is-open="isMoveOpen" css-class="move-product-modal" @didDismiss="closeMoveModal"
        :backdropDismiss="!movingItem" :canDismiss="!movingItem">
        <ion-content class="product-info-content" v-if="moveItem">
          <div class="product-info-wrapper">
            <h3 class="info-title">MOVER PRODUCTO</h3>

            <div class="info-product-block">
              <div class="info-product-image-wrapper">
                <img :src="moveItem.imageUrl" :alt="moveItem.name" />
              </div>
              <span class="info-product-name">{{ moveItem.name }}</span>
            </div>

            <div class="info-form">
              <div class="info-row-single">
                <div class="info-field">
                  <label class="info-label">Despensa destino</label>
                  <ion-select interface="popover" v-model="selectedPantryCode" class="info-select"
                    placeholder="Selecciona una despensa" :disabled="movingItem">
                    <ion-select-option v-for="p in destinationPantries" :key="p.id" :value="p.code">
                      {{ p.name }} ({{ p.code }})
                    </ion-select-option>
                  </ion-select>
                </div>
              </div>

              <div class="info-row">
                <div class="info-field">
                  <label class="info-label">Cantidad a mover</label>

                  <div class="qty-inline">
                    <ion-button fill="clear" size="small" class="qty-btn qty-btn-modal qty-btn-minus qty-inline-btn"
                      @click="changeMoveQuantity(-1)" :disabled="movingItem">
                      <span class="material-icons">remove</span>
                    </ion-button>

                    <ion-input type="number" inputmode="numeric" v-model.number="moveQuantity"
                      class="info-input-exception qty-input qty-inline-input" :disabled="movingItem" />

                    <ion-button fill="clear" size="small" class="qty-btn qty-btn-modal qty-btn-plus qty-inline-btn"
                      @click="changeMoveQuantity(1)" :disabled="movingItem">
                      <span class="material-icons">add</span>
                    </ion-button>
                  </div>

                  <small class="info-helper">
                    Mínimo 1, máximo {{ moveMaxQuantity }}
                  </small>
                </div>

                <div class="info-field">
                  <label class="info-label">Unidad</label>
                  <ion-input :value="moveItem.unit" class="info-input info-input-readonly" readonly />
                </div>
              </div>

              <div class="info-actions">
                <ion-button expand="block" fill="outline" class="btn-info-cancel" @click="closeMoveModal"
                  :disabled="movingItem">
                  <span class="material-icons">close</span> Cancelar
                </ion-button>

                <ion-button expand="block" class="btn-info-save" @click="confirmMove" :disabled="movingItem">
                  Mover
                </ion-button>
              </div>
            </div>

            <!-- OVERLAY LOADER MODAL -->
            <div v-if="movingItem" class="modal-saving-overlay">
              <ion-spinner name="crescent" style="transform:scale(1.6);" />
              <p class="modal-saving-text">Moviendo…</p>
            </div>
          </div>
        </ion-content>
      </ion-modal>
      <!-- Modal mover producto END -->

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonContent, IonSpinner, IonButton, IonIcon, IonSearchbar, IonModal, IonInput, IonSelect, IonSelectOption } from '@ionic/vue'
import { cartOutline, trashOutline, swapHorizontalOutline } from 'ionicons/icons'
import type { Item } from '@/models/item'
import type { Location } from '@/models/location'
import type { Pantry } from '@/models/pantry'
import { onMounted, onBeforeUnmount, ref, computed, inject, watch, type Ref } from 'vue'
import { collection, query, where, updateDoc, doc, getDocs, writeBatch, increment, onSnapshot, limit, type Unsubscribe, orderBy } from 'firebase/firestore'
import { db } from '@/firebase'
import { showToast } from '@/composables/showToast'
import { getMeasurementUnit, getOptimizedUrl, isImageGalery } from '@/composables/itemUtils'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import ModalAddProduct from '@/components/layout/ModalAddProduct.vue'
import InventoryAndPurcharseHeader from '@/components/ui/InventoryAndPurcharseHeader.vue'
import { Capacitor } from '@capacitor/core'
import { actionSheetController } from '@ionic/vue'

const props = defineProps<{ code: string; name: string }>()
console.log('Codigo y nombre de la despensa:', props.code, props.name)

const loading = ref<boolean>(false)
const search = ref<string>('')
const savingItem = ref<boolean>(false)
const movingItem = ref<boolean>(false)

let stop: Unsubscribe | null = null
const items = ref<Item[]>([])

const locations = ref<Location[]>([])

// Despensas reales obtenidas por códigos guardados en localStorage
const pantries = ref<Pantry[]>([])

const destinationPantries = computed(() =>
  pantries.value.filter(p => p.code !== props.code)
)

// Normaliza: quita acentos y pasa a minúsculas
const norm = (s: string) =>
  s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()

// Lista filtrada según el texto del searchbar
const itemsFiltered = computed(() => {
  const q = norm(search.value)
  if (!q) return items.value
  return items.value.filter(it => norm(it.name).includes(q))
})

// Lista de productos en inventario con imagen y filtro por nombre
const pantryDocId = ref<string | null>(null)
const purchaseCount = inject<Ref<number> | null>('purchaseCount', null)

watch(
  items,
  () => {
    if (purchaseCount) {
      purchaseCount.value = items.value.filter(it => it.inPurchase).length
    }
  },
  { deep: true, immediate: true }
)

onMounted(() => {
  getPantryItems(props.code)
  loadPantries()
})

// Al cerrar la ventana dejaremos de escuchar a firestore
onBeforeUnmount(() => stop?.())

// Estado del modal de información
const isInfoOpen = ref(false)
const selectedItem = ref<Item | null>(null)

// Estado del modal de mover
const isMoveOpen = ref(false)
const moveItem = ref<Item | null>(null)
const selectedPantryCode = ref<string>('')
const moveQuantity = ref<number | null>(null)
const moveMaxQuantity = ref<number>(0)

// Campos editables del modal de info
const editQuantity = ref<number | null>(null)
const editUnit = ref<string>()
const editLocation = ref<Location | null>(null)
const editExpirationDate = ref<string | null>(null)

const editExpirationDateInput = computed<string>({
  get: () => editExpirationDate.value ?? '',
  set: (v: string) => {
    const s = String(v ?? '').trim()
    editExpirationDate.value = s ? s : null
  }
})

const unitOptions = ['Unidad', 'Kilogramo', 'Gramo', 'Litro', 'Mililitro']

// refs para manejar la imagen pendiente de guardar
const pendingImageFile = ref<File | null>(null)
const pendingImagePublicId = ref<string | null>(null)

// Guardar la imagen anterior para poder restaurar si falla el update
const prevImageUrl = ref<string | null>(null)
const prevImageItemId = ref<string | null>(null)

function rememberPrevImage(item: Item) {
  prevImageUrl.value = item.imageUrl ?? null
  prevImageItemId.value = item.id ?? null
}

function restorePrevImageIfNeeded(item: Item) {
  if (!prevImageItemId.value || item.id !== prevImageItemId.value) return
  if (prevImageUrl.value !== null) item.imageUrl = prevImageUrl.value
  pendingImageFile.value = null
  pendingImagePublicId.value = null
  prevImageUrl.value = null
  prevImageItemId.value = null
}

function clearPrevImageIfNeeded(item: Item) {
  if (!prevImageItemId.value || item.id !== prevImageItemId.value) return
  pendingImageFile.value = null
  pendingImagePublicId.value = null
  prevImageUrl.value = null
  prevImageItemId.value = null
}

// CADUCIDAD / ALERTA EN CARD 
function daysUntilExpiration(expiration: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const exp = new Date(`${expiration}T00:00:00`)
  exp.setHours(0, 0, 0, 0)

  const msPerDay = 24 * 60 * 60 * 1000
  return Math.floor((exp.getTime() - today.getTime()) / msPerDay)
}

function isExpiringSoon(item: Item): boolean {
  const exp = (item as any).expirationDate as string | null | undefined
  if (!exp) return false
  const d = daysUntilExpiration(exp)
  return d >= 0 && d < 3
}

// CARGA DE DESPENSAS POR CÓDIGOS EN LOCALSTORAGE 
async function loadPantries() {
  try {
    const raw = localStorage.getItem('myPantries')
    let codesList: string[] = []

    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          codesList = parsed as string[]
        }
      } catch {
        codesList = []
      }
    }

    if (!codesList.length) {
      pantries.value = []
      return
    }

    const qPantries = query(
      collection(db, 'pantries'),
      where('code', 'in', codesList),
      orderBy('name', 'asc')
    )

    const snap = await getDocs(qPantries)
    pantries.value = snap.docs.map(d => {
      const pantryData = d.data() as any
      const pantry: Pantry = {
        id: String(d.id),
        code: String(pantryData.code ?? ''),
        name: String(pantryData.name ?? ''),
        memberCount: Number(pantryData.memberCount ?? 1),
        totalItems: Number(pantryData.totalItems ?? 0),
        creatorId: String(pantryData.creatorId ?? '0000')
      }
      return pantry
    })
  } catch (err) {
    console.error('Error al cargar despensas:', err)
    await showToast('Error al cargar tus despensas.', 'danger')
  }
}

//  HELPERS DE CANTIDAD 
function getStepForUnit(unitRaw: string | undefined | null): number {
  const u = (unitRaw || '').toLowerCase()

  if (u === 'gramo' || u === 'gramos' || u === 'mililitro' || u === 'mililitros') {
    return 50
  }

  if (
    u === 'kilogramo' ||
    u === 'kilogramos' ||
    u === 'kg' ||
    u === 'litro' ||
    u === 'litros' ||
    u === 'unidad' ||
    u === 'unidades'
  ) {
    return 1
  }

  return 1
}

// Ajusta la cantidad aplicando el paso y, si es step 50, busca el múltiplo entero 50/100 la primera vez
function getAdjustedQuantity(
  current: number,
  step: number,
  deltaSign: 1 | -1,
  min = 0,
  max = Number.POSITIVE_INFINITY
): number {
  let target = current

  if (step === 50) {
    if (deltaSign === 1) {
      if (current < step) {
        target = step
      } else if (current % step === 0) {
        target = current + step
      } else {
        target = Math.floor(current / step) * step + step
      }
    } else {
      if (current <= 0) {
        target = 0
      } else if (current % step === 0) {
        target = current - step
      } else {
        target = Math.floor(current / step) * step
      }
    }
  } else {
    target = current + deltaSign * step
  }

  if (target < min) target = min
  if (target > max) target = max

  return target
}

// Ajuste de cantidad directo en la card
async function adjustItemQuantity(item: Item, deltaSign: 1 | -1) {
  const step = getStepForUnit(item.unit)
  const newQty = getAdjustedQuantity(item.quantity, step, deltaSign, 0)

  try {
    const refItem = doc(db, 'items', item.id)
    await updateDoc(refItem, { quantity: newQty })
    item.quantity = newQty
  } catch (err) {
    console.error('Error al actualizar cantidad:', err)
    await showToast('No se pudo actualizar la cantidad.', 'danger')
  }
}

// Para el modal de editar producto (solo cambia el campo local, se guarda en saveItemInfo)
function changeEditQuantity(deltaSign: 1 | -1) {
  if (!selectedItem.value) return

  const unitToUse = editUnit.value || selectedItem.value.unit
  const step = getStepForUnit(unitToUse)
  const current = editQuantity.value ?? 0
  const newQty = getAdjustedQuantity(current, step, deltaSign, 0)

  editQuantity.value = newQty
}

// Para el modal de mover producto (respeta mínimo 1 y máximo moveMaxQuantity)
function changeMoveQuantity(deltaSign: 1 | -1) {
  if (!moveItem.value) return

  const step = getStepForUnit(moveItem.value.unit)
  const current = moveQuantity.value ?? 1
  const newQty = getAdjustedQuantity(current, step, deltaSign, 1, moveMaxQuantity.value)

  moveQuantity.value = newQty
}

// MODAL INFO PRODUCTO 
async function openInfoModal(item: Item) {
  selectedItem.value = item
  editQuantity.value = item.quantity
  editUnit.value = item.unit || 'Unidad'
  editExpirationDate.value = (item as any).expirationDate ?? null
  getLocations(item.locationId || null)
  isInfoOpen.value = true
}

// Cierra el modal de información y resetea los campos
function closeInfoModal() {
  // Si tenía una imagen en preview sin guardar, la restauramos al cerrar
  if (selectedItem.value) {
    restorePrevImageIfNeeded(selectedItem.value)
  }

  isInfoOpen.value = false
  selectedItem.value = null
  editQuantity.value = null
  editUnit.value = 'Unidad'
  editLocation.value = null
  editExpirationDate.value = null
  savingItem.value = false
}

async function getLocations(locationId: string | null) {
  loading.value = true
  const q = query(collection(db, 'locations'), orderBy('name', 'asc'))

  stop = onSnapshot(
    q,
    snap => {
      locations.value = snap.docs.map(d => {
        const loc = d.data() as any
        return {
          id: String(d.id),
          name: String(loc.name ?? '')
        } as Location
      })

      editLocation.value = locations.value.find(l => l.id === locationId) ?? null

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

// Sustituye SOLO la función saveItemInfo por esta
async function saveItemInfo() {
  if (!selectedItem.value || editQuantity.value == null) {
    await showToast('Rellena la cantidad antes de guardar.', 'danger')
    return
  }

  savingItem.value = true

  try {
    if (pendingImageFile.value && pendingImagePublicId.value) {
      const url = await uploadToCloudinary(
        pendingImageFile.value,
        pendingImagePublicId.value
      )
      if (!url) {
        await showToast('Error al subir la imagen a la nube.', 'danger')
        // Restaurar si falla la subida
        restorePrevImageIfNeeded(selectedItem.value)
        return
      }
      selectedItem.value.imageUrl = url
    }

    const expirationToSave = editExpirationDate.value ? editExpirationDate.value.trim() : null
    console.log('selectedItem.value.imageUrl', selectedItem.value.imageUrl)
    const refItem = doc(db, 'items', selectedItem.value.id)
    await updateDoc(refItem, {
      quantity: editQuantity.value,
      unit: editUnit.value,
      imageUrl: selectedItem.value.imageUrl,
      locationId: editLocation.value ? editLocation.value.id : null,
      expirationDate: expirationToSave
    })

    ;(selectedItem.value as any).expirationDate = expirationToSave

    // limpiamos el estado de preview (ya es imagen real)
    clearPrevImageIfNeeded(selectedItem.value)

    await showToast('Producto actualizado.', 'success')
    closeInfoModal()
  } catch (err) {
    console.error('Error al actualizar producto:', err)
    // si falla el update, restaurar imagen anterior
    if (selectedItem.value) {
      restorePrevImageIfNeeded(selectedItem.value)
    }
    await showToast('No se pudo actualizar el producto.', 'danger')
  } finally {
    savingItem.value = false
  }
}

// Solo para WEB: muestra un menú y devuelve la fuente elegida
async function pickWebSource(): Promise<CameraSource | null> {
  const sheet = await actionSheetController.create({
    header: 'Seleccionar imagen',
    buttons: [
      {
        text: 'Galería',
        handler: () => {
          sheet.dismiss(CameraSource.Photos)
          return false
        }
      },
      {
        text: 'Cámara',
        handler: () => {
          sheet.dismiss(CameraSource.Camera)
          return false
        }
      }
    ],
    backdropDismiss: true
  })
  await sheet.present()

  const { data } = await sheet.onDidDismiss<CameraSource | null>()
  return (data ?? null)
}


// Obtiene una imagen de la cámara/galería y la deja solo en memoria como preview hasta que el usuario pulse Guardar
async function pickImage(item: Item) {
  try {
    const isWeb = Capacitor.getPlatform() === 'web'
    const source = isWeb ? await pickWebSource() : CameraSource.Prompt
    if (!source) return

    const photo = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source,
      ...(isWeb
        ? {}
        : {
            promptLabelHeader: 'Seleccionar imagen',
            promptLabelPhoto: 'Galería',
            promptLabelPicture: 'Cámara'
          })
    })

    if (!photo.dataUrl) return

    const response = await fetch(photo.dataUrl)
    const blob = await response.blob()

    const safeName = norm(item.name)
    const publicId = `${safeName}_${item.pantryCode}_${Date.now()}`

    const file = new File([blob], `${publicId}.jpg`, {
      type: blob.type || 'image/jpeg'
    })

    // guardamos la imagen anterior SOLO la primera vez para ese item
    if (prevImageItemId.value !== item.id) {
      rememberPrevImage(item)
    }

    pendingImageFile.value = file
    pendingImagePublicId.value = publicId
    item.imageUrl = photo.dataUrl
  } catch (err) {
    console.error('Error al elegir imagen:', err)
    //await showToast('Cancelado o error al elegir imagen', 'danger')
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

  const res = await fetch(
    'https://api.cloudinary.com/v1_1/dpgqmi3zs/image/upload',
    {
      method: 'POST',
      body: formData
    }
  )

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
          imageUrl: String(item.imageUrl ?? ''),
          expirationDate: item.expirationDate ?? null
        } as Item
      })
      loading.value = false
      console.log('items obtenidos: ', items.value)
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
    await updateDoc(ref, { inPurchase: !item.inPurchase, notePurchase: null })
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

// Obtener ref de una despensa por código genérico (para despensa destino)
async function getPantryRefByCodeGeneric(code: string) {
  const q = query(
    collection(db, 'pantries'),
    where('code', '==', code),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) throw new Error(`No existe la despensa con code ${code}`)
  return snap.docs[0].ref
}

// MODAL MOVER PRODUCTO 
function openMoveModal(item: Item) {
  moveItem.value = item
  moveMaxQuantity.value = item.quantity
  moveQuantity.value = item.quantity > 0 ? 1 : 0
  selectedPantryCode.value = ''
  isMoveOpen.value = true
}

// Cierra el modal de información y resetea los campos
function closeMoveModal() {
  isMoveOpen.value = false
  moveItem.value = null
  selectedPantryCode.value = ''
  moveQuantity.value = null
  moveMaxQuantity.value = 0
  movingItem.value = false
}

async function confirmMove() {
  if (!moveItem.value) {
    await showToast('No hay producto seleccionado.', 'danger')
    return
  }

  if (!selectedPantryCode.value) {
    await showToast('Selecciona una despensa destino.', 'danger')
    return
  }

  if (selectedPantryCode.value === moveItem.value.pantryCode) {
    await showToast('La despensa destino debe ser distinta a la actual.', 'danger')
    return
  }

  if (moveQuantity.value == null || Number.isNaN(moveQuantity.value)) {
    await showToast('Introduce una cantidad válida a mover.', 'danger')
    return
  }

  const qty = Math.floor(moveQuantity.value)
  if (qty < 1) {
    await showToast('La cantidad mínima a mover es 1.', 'danger')
    return
  }

  if (qty > moveMaxQuantity.value) {
    await showToast('No puedes mover más cantidad de la que tienes.', 'danger')
    return
  }

  movingItem.value = true

  try {
    const destCode = selectedPantryCode.value

    // Buscamos si ya existe el item en la despensa destino con el mismo nombre e imagen
    const qDest = query(
      collection(db, 'items'),
      where('pantryCode', '==', destCode),
      where('name', '==', moveItem.value.name),
      limit(1)
    )

    const snapDest = await getDocs(qDest)
    const batch = writeBatch(db)

    if (!snapDest.empty) {
      // Ya existe el producto en la despensa destino
      const destDoc = snapDest.docs[0]
      const destData = destDoc.data() as any

      const currentDestQty = Number(destData.quantity ?? 0)
      batch.update(destDoc.ref, {
        quantity: currentDestQty + qty
      })
    } else {
      // No existe: creamos el item en la despensa destino
      const newRef = doc(collection(db, 'items'))
      batch.set(newRef, {
        name: moveItem.value.name,
        quantity: qty,
        unit: moveItem.value.unit,
        pantryCode: destCode,
        locationId: null,
        inPurchase: false,
        imageUrl: moveItem.value.imageUrl,
        notePurchase: (moveItem.value as any).notePurchase ?? '',
        expirationDate: (moveItem.value as any).expirationDate ?? null
      })
      
      // Nuevo producto en esa despensa: aumentar totalItems en despensa destino
      const destPantryRef = await getPantryRefByCodeGeneric(destCode)
      batch.update(destPantryRef, { totalItems: increment(1) })
    }

    // Actualizamos la cantidad en la despensa origen
    const originRef = doc(db, 'items', moveItem.value.id)
    const newOriginQty = moveItem.value.quantity - qty
    batch.update(originRef, {
      quantity: newOriginQty
    })

    await batch.commit()

    // Actualizamos el objeto local para que el modal se vea coherente hasta que llegue el snapshot
    moveItem.value.quantity = newOriginQty

    await showToast('Producto movido correctamente.', 'success')
    closeMoveModal()
  } catch (err) {
    console.error('Error al mover producto:', err)
    await showToast('No se pudo mover el producto.', 'danger')
  } finally {
    movingItem.value = false
  }
}
</script>

<style scoped>
/* BUSCADOR */
.actions {
  display: grid;
  gap: 12px;
  margin-bottom: 8px;
}

ion-searchbar {
  --border-radius: 999px;
}

body.dark ion-searchbar {
  --background: #2d2e2e;
  --placeholder-color: #ffffff;
  --color: #ffffff;
  --icon-color: rgba(255, 255, 255, 0.69);
  --clear-icon-color: #888888;
  --border-color: #444444;
  --border-radius: 999px;
}

/* LOADING */
.loading-box {
  display: grid;
  place-content: center;
  min-height: 40vh;
}

/*SIN RESULTADOS */
.empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  padding: 24px 16px;
  text-align: center;

  color: var(--ion-text-color3);
}

.empty-icon {
  width: 120px;
  height: 120px;
  margin-bottom: 2px;

  display: grid;
  place-items: center;

  border-radius: 999px;
}

.empty-icon .material-icons {
  font-size: 78px;
  color: var(--ion-text-color2);
}

.empty-title {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 700;
  color: var(--ion-text-color2);
}

.empty-subtitle {
  margin: 0;
  font-size: 17px;
  font-weight: 500;
  color: var(--ion-text-color2);
}

.items-grid {
  margin-top: 8px;

  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 14px;
}

.item-card {
  position: relative;

  display: flex;
  flex-direction: column;

  padding: 14px;
  border-radius: 12px;

  text-align: center;

  background: #ffffff;
  border: 1px solid #eef2f4;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
}

body.dark .item-card {
  background: var(--ion-background-color);
  border-color: #333333;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

/* CADUCIDAD PROXIMA */
.item-card-expiring {
  border: 2px solid #ef4444;
  box-shadow: 0 2px 12px rgba(239, 68, 68, 0.18);
}

/* IMAGEN DE PRODUCTO */
.item-card img {
  width: 100%;
  height: 80px;
  margin: 0 auto 8px;

  display: block;
  object-fit: contain;
}

/* IMAGEN DE GALERÍA */
.item-card img.img-galery {
  width: 50%;
  height: 80px;
  margin: 0 auto 8px;

  display: block;
  object-fit: cover;
  border-radius: 5%;
}

/* NOMBRE (con máximo de 2 líneas) */
.item-name {
  margin: 0;
  line-height: 1.2;

  font-size: 14px;
  font-weight: 700;
  color: var(--ion-text-color);

  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;

  min-height: calc(1.2em * 2);
}

/* CANTIDAD DE PRODUCTOS */
.item-units {
  margin: 3px 0 5px;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;

  font-size: 12px;
  color: var(--ion-text-color);
}

.item-units-value {
  min-width: 70px;
  text-align: center;
}

.qty-btn {
  --padding: 2px;
  margin: 2% 1%;
}

.qty-btn .material-icons {
  font-size: 14px;
  color: var(--ion-text-color);
}

/* BOTONES + Y - DENTRO DE LA TARJETA */
.qty-btn-card {
  --border-radius: 999px;
  --border-width: 1px;
  --border-style: solid;
  --border-color: #d1d5db;

  --background: var(--ion-background-color);

  width: 26px;
  height: 26px;
}

body.dark .qty-btn-card {
  --border-color: #9c9c9c;
}

.qty-btn-card::part(native) {
  width: 26px;
  height: 26px;
  border-radius: 999px;

  display: flex;
  align-items: center;
  justify-content: center;
}

.card-actions {
  margin-top: auto;
  display: flex;
  justify-content: center;
}

/* AÑADIR A COMPRA */
.btn-add {
  --background: var(--md-accent, #2ea15d);
  --background-hover: rgba(var(--md-accent-rgb, 46, 161, 93), 0.92);
  --background-activated: rgba(var(--md-accent-rgb, 46, 161, 93), 0.86);
  --color: #ffffff;

  height: 33px;
  border-radius: 8px;

  font-weight: 600;
  text-transform: none;
}

/*QUITAR DE COMPRA */
.btn-remove {
  --background: #dc2626;
  --background-hover: #b91c1c;
  --background-activated: #991b1b;
  --color: #ffffff;

  height: 33px;
  border-radius: 8px;

  font-weight: 600;
  text-transform: none;
}

/* BOTONES EN LAS ESQUINAS DE TARJETAS */
.move-btn,
.delete-btn {
  position: absolute;
  top: 6px;

  width: 32px;
  height: 32px;
  z-index: 2;

  display: flex;
  align-items: center;
  justify-content: center;

  --padding-start: 0;
  --padding-end: 0;
  --padding-top: 0;
  --padding-bottom: 0;

  --color: #ffffff;
}

.move-btn::part(native),
.delete-btn::part(native) {
  width: 32px;
  height: 32px;
  border-radius: 50%;

  display: flex;
  align-items: center;
  justify-content: center;
}

/* BOTON MOVER PRODUCTO */
.move-btn {
  left: 1px;

  --background: var(--md-accent, #2ea15d);
  --background-hover: rgba(var(--md-accent-rgb, 46, 161, 93), 0.92);
  --background-activated: rgba(var(--md-accent-rgb, 46, 161, 93), 0.86);
}

/* BOPTON ELIMINAR */
.delete-btn {
  right: 1px;

  --background: #ef4444;
  --background-hover: #dc2626;
  --background-activated: #b91c1c;
}

.delete-btn ion-icon {
  --ionicon-stroke-width: 35px;
}


/* MODAL INFO PRODUCTO + MODAL MOVER PRODUCTO: */

/* VENTANA MODAL */
.product-info-modal::part(content),
.move-product-modal::part(content) {
  width: min(360px, 90%);
  max-height: 70%;

  border-radius: 18px;
  overflow: hidden;

  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
  background: var(--ion-background-color);
}

body.dark .product-info-modal::part(content),
body.dark .move-product-modal::part(content) {
  background: #1e1e1e;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.product-info-content {
  --background: var(--ion-background-color);
}

.product-info-wrapper {
  position: relative;
  padding: 18px 16px 20px;
}

/* TITULO INFORMACION PRODUCTO MODAL */
.info-title {
  margin: 0 0 10px;
  text-align: center;

  font-size: 20px;
  font-weight: 700;
  color: var(--ion-text-color);

  margin-bottom: 6%;
}

.info-product-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 12%;
}

/* IMAGEN INFORMACIÓN PRODUCTO */
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

/* ICONO CAMBIAR FOTO */
.info-product-icon {
  position: absolute;
  top: 85px;
  right: 1px;

  font-size: 25px;
  padding: 2px;

  border-radius: 50%;
  background: var(--md-accent, #2ea15d);
  color: #ffffff;

  pointer-events: none;
}

.info-product-name {
  margin-top: 4%;
  font-size: 18px;
  font-weight: 600;
  color: var(--ion-text-color);
}

/* FORMULARIO */
.info-form {
  margin-top: 4px;
}

.info-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 18px;
}

.info-row2,
.info-row-single {
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
  color: var(--ion-text-color2);
}

/* INPUTS/SELECT */
.info-input,
.info-select {
  --background: #f7f9fa;
  --padding-start: 8px;
  --padding-end: 8px;
  --padding-top: 6px;
  --padding-bottom: 6px;
  --border-radius: 10px;

  --highlight-color-focused: var(--md-accent, #2ea15d);
  --highlight-color: var(--md-accent, #2ea15d);
  --highlight-color-valid: var(--md-accent, #2ea15d);
  --highlight-height: 2px;

  border-radius: 10px;
  border: 1px solid rgba(229, 231, 235, 0.13);

  font-size: 14px;
}

body.dark .info-input,
body.dark .info-select {
  --background: #292929;
}

.info-input-exception {
  --background: #f7f9fa;
  --padding-start: 1px;
  --padding-top: 6px;
  --padding-bottom: 6px;

  border-radius: 10px;
  font-size: 14px;

  --highlight-color-focused: var(--md-accent, #2ea15d);
  --highlight-color: var(--md-accent, #2ea15d);
  --highlight-color-valid: var(--md-accent, #2ea15d);
  --highlight-height: 2px;
}

body.dark .info-input-exception {
  --background: #292929;
}

.info-input-readonly {
  --background: #f3f4f6;
}

.info-helper {
  margin-top: 4px;
  font-size: 11px;
  color: var(--ion-text-color2);
}

/* CONTENEDOR MODAL */
.qty-inline {
  display: flex;
  align-items: center;
  gap: 4px;

  padding: 0 10px;

  background: #f9fafb;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}

body.dark .qty-inline {
  background: #2a2a2a;
  border-color: #444444;
}

.qty-inline-input {
  width: 100%;
  text-align: center;

  --background: transparent;
  --border-width: 0;

  --padding-start: 0;
  --padding-end: 0;
  --padding-top: 6px;
  --padding-bottom: 6px;
}

/* BOTONES */
.qty-inline-btn {
  margin: 0;

  --padding-start: 0;
  --padding-end: 0;
  --padding-top: 0;
  --padding-bottom: 0;
}

/* BOTONES DE + Y - */
.qty-btn-modal::part(native) {
  width: 32px;
  height: 32px;
  border-radius: 999px;

  display: flex;
  align-items: center;
  justify-content: center;
}

.qty-btn-plus {
  --background: #2fa15e;
  --background-hover: rgba(var(--md-accent-rgb, 46, 161, 93), 0.92);
  --background-activated: rgba(var(--md-accent-rgb, 46, 161, 93), 0.86);
  --color: #ffffff;
}

.qty-btn-minus {
  --background: #ef4444;
  --background-hover: #dc2626;
  --background-activated: #b91c1c;
  --color: #ffffff;
}

/* MODAL ACCIONES */
.info-actions {
  display: flex;
  gap: 10px;
}

.btn-info-cancel {
  flex: 1;

  --background: var(--ion-background-color);
  --border-color: var(--md-accent, #2ea15d);
  --border-width: 1px;
  --box-shadow: none;

  --color: var(--md-accent, #2ea15d);

  border-radius: 999px;
  font-weight: 600;
  text-transform: none;
}

body.dark .btn-info-cancel {
  --background: rgba(var(--md-accent-rgb, 46, 161, 93), 0.08);
}

.btn-info-save {
  flex: 1;

  --background: var(--md-accent, #2ea15d);
  --background-hover: rgba(var(--md-accent-rgb, 46, 161, 93), 0.92);
  --background-activated: rgba(var(--md-accent-rgb, 46, 161, 93), 0.86);
  --color: #ffffff;

  border-radius: 999px;
  font-weight: 600;
  text-transform: none;
}

/* MODAL DE CARGA */
.modal-saving-overlay {
  position: absolute;
  inset: 0;
  z-index: 999;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;

  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(2px);
}

.modal-saving-text {
  margin: 0;
  font-weight: 700;
  color: #111827;
}
</style>
