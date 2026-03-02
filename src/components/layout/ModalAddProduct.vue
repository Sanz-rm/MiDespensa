<template>
  <!-- Botón flotante START -->
  <ion-fab slot="fixed" vertical="bottom" horizontal="end">
    <ion-fab-button @click="openCreateModal" :aria-label="fabAriaLabel" class="add-button">
      <ion-icon :icon="addOutline" />
    </ion-fab-button>
  </ion-fab>
  <!-- Botón flotante END -->

  <!-- Modal crear producto START -->
  <ion-modal :is-open="isCreateOpen" @didDismiss="closeCreateModal" @willPresent="emit('willOpen')">
    <!-- Header modal START -->
    <ion-header>
      <ion-toolbar class="create-modal-toolbar">
        <ion-title class="create-modal-title">{{ modalTitle }}</ion-title>
        <ion-buttons slot="end">
          <ion-button class="create-modal-close-btn" @click="closeCreateModal">
            CERRAR
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <!-- Header modal END -->

    <!-- Contenido modal START -->
    <ion-content class="ion-padding create-modal-content">
      <ion-list>
        <ion-item lines="none" class="create-modal-item">
          <ion-label position="stacked" class="create-modal-label">
            Nombre del producto
          </ion-label>
          <ion-input
            v-model="newProductName"
            class="create-modal-input"
            placeholder="Ej. Leche, Huevos, Arroz"
            @keyup.enter="confirmCreate"
          />
        </ion-item>

        <div class="create-modal-actions">
          <ion-button expand="block" fill="clear" class="btn-cancel-outline" @click="clearInput">
            CANCELAR
          </ion-button>
          <ion-button expand="block" class="btn-create-solid" @click="confirmCreate">
            CREAR
          </ion-button>
        </div>
      </ion-list>

      <!-- PRODUCTOS CREADOS PARA AÑADIR AL INVENTARIO START -->
      <div class="suggested-wrapper">
        <h3 class="suggested-title">{{ modalSubtitle }}</h3>

        <!-- INVENTARIO: solo comunes que no tenemos (se mantiene igual) -->
        <template v-if="view === 'inventory'">
          <!-- Render de los items comunes -->
          <div v-if="comunItemsFiltered && comunItemsFiltered.length">
            <div class="suggested-grid">
              <div
                v-for="item in comunItemsFiltered"
                :key="item.id"
                class="suggested-card"
                @click="openQuickCreateFromCommon(item.name, item.imageUrl)"
              >
                <img
                  v-if="item.imageUrl"
                  :src="getOptimizedUrl(item.imageUrl)"
                  :alt="item.name"
                  class="suggested-img"
                  :class="{ 'img-galery': isImageGalery(item.imageUrl) }"
                />

                <div v-else class="suggested-letter" aria-hidden="true">
                  {{ getInitial(item.name) }}
                </div>

                <p class="suggested-name">{{ item.name }}</p>

                <!-- Botón para añadir al inventario -->
                <ion-button
                  size="small"
                  class="btn-add"
                  @click.stop="addItemFromPantry(item.name, item.imageUrl)"
                >
                  <ion-icon :icon="addOutline" slot="start" />
                  Añadir
                </ion-button>
              </div>
            </div>
          </div>
          <!-- Render de los items comunes END -->

          <!-- Sin productos START -->
          <div v-else class="empty">
            <div class="empty-icon">
              <span class="meta-icon material-icons" aria-hidden="true">inventory_2</span>
            </div>
            <p class="empty-title">No hay resultados con la búsqueda</p>
            <p class="empty-subtitle">¡Crea el producto que necesites!</p>
          </div>
          <!-- Sin productos END -->
        </template>

        <!-- COMPRA: comunes + inventario NO en compra, intercalados y filtrables -->
        <template v-else>
          <!-- Filtros radio START -->
          <div class="filter-radios mydict">
            <div>
              <label>
                <input type="radio" name="filterMode" value="all" v-model="filterMode" />
                <span>Todos</span>
              </label>
              <label>
                <input type="radio" name="filterMode" value="inventory" v-model="filterMode" />
                <span>Inventario</span>
              </label>
            </div>
          </div>
          <!-- Filtros radio END -->

          <!-- Lista combinada START-->
          <div v-if="combinedItems && combinedItems.length" class="suggested-grid">
            <div
              v-for="item in combinedItems"
              :key="item.kind + '-' + item.id"
              class="suggested-card"
              @click="item.kind === 'common' ? openQuickCreateFromCommon(item.name, item.imageUrl) : null"
            >
              <img
                v-if="item.imageUrl"
                :src="getOptimizedUrl(item.imageUrl)"
                :alt="item.name"
                class="suggested-img"
                :class="{ 'img-galery': isImageGalery(item.imageUrl) }"
              />

              <div v-else class="suggested-letter" aria-hidden="true">
                {{ getInitial(item.name) }}
              </div>

              <p class="suggested-name">{{ item.name }}</p>

              <!-- Botón según tipo -->
              <ion-button
                size="small"
                class="btn-add"
                @click.stop="
                  item.kind === 'common'
                    ? addItemFromPantry(item.name, item.imageUrl)
                    : addExistingToPurchase(item.id)
                "
              >
                <ion-icon :icon="addOutline" slot="start" />Añadir
              </ion-button>
            </div>
          </div>
          <!-- Lista combinada END-->

          <!-- Sin productos START -->
          <div v-else class="empty">
            <div class="empty-icon">
              <span class="meta-icon material-icons" aria-hidden="true">inventory_2</span>
            </div>
            <p class="empty-title">No hay resultados con la búsqueda</p>
            <p class="empty-subtitle">¡Crea el producto que necesites!</p>
          </div>
          <!-- Sin productos END -->
        </template>
      </div>
      <!-- PRODUCTOS CREADOS PARA AÑADIR AL INVENTARIO END -->
    </ion-content>
    <!-- Contenido modal END -->
  </ion-modal>
  <!-- Modal crear producto END -->

  <ion-modal :is-open="isQuickCreateOpen" css-class="product-info-modal" @didDismiss="onQuickCreateDidDismiss">
    <ion-content class="product-info-content">
      <div class="product-info-wrapper">
        <h3 class="info-title">CREAR PRODUCTO</h3>

        <div class="info-product-block">
          <div class="info-product-image-wrapper">
            <img
              v-if="quickImageUrl"
              :src="getOptimizedUrl(quickImageUrl)"
              :alt="quickName"
              :class="{ 'info-img-galery': isImageGalery(quickImageUrl) }"
            />

            <div v-else class="modal-item-letter" aria-hidden="true">
              {{ getInitial(quickName) }}
            </div>
          </div>
          <span class="info-product-name">{{ quickName }}</span>
        </div>

        <div class="info-form">
          <div class="info-row">
            <div class="info-field">
              <label class="info-label">Cantidad</label>
              <div class="qty-inline">
                <ion-button
                  fill="clear"
                  size="small"
                  class="qty-btn qty-btn-modal qty-btn-minus qty-inline-btn"
                  @click="changeQuickQuantity(-1)"
                  :disabled="loading"
                >
                  <span class="material-icons" style="color: var(--ion-text-color4);">remove</span>
                </ion-button>

                <ion-input
                  type="number"
                  inputmode="numeric"
                  v-model.number="quickQuantity"
                  class="info-input-exception qty-input qty-inline-input"
                  :disabled="loading"
                />

                <ion-button
                  fill="clear"
                  size="small"
                  class="qty-btn qty-btn-modal qty-btn-plus qty-inline-btn"
                  @click="changeQuickQuantity(1)"
                  :disabled="loading"
                >
                  <span class="material-icons" style="color: var(--ion-text-color4);">add</span>
                </ion-button>
              </div>
            </div>

            <div class="info-field">
              <label class="info-label">Unidad</label>
              <ion-select interface="popover" v-model="quickUnit" class="info-select" :disabled="loading">
                <ion-select-option v-for="u in unitOptions" :key="u" :value="u">
                  {{ u }}
                </ion-select-option>
              </ion-select>
            </div>
          </div>

          <div class="info-row2">
            <div class="info-field">
              <label class="info-label">Localización</label>
              <ion-select
                interface="popover"
                v-model="quickLocation"
                class="info-select"
                placeholder="Selecciona una localización"
                :disabled="loading"
              >
                <ion-select-option :value="null">
                  Ninguna
                </ion-select-option>
                <ion-select-option v-for="l in locations" :key="l.id" :value="l">
                  {{ l.name }}
                </ion-select-option>
              </ion-select>
            </div>
          </div>

          <div class="info-row2">
            <div class="info-field">
              <label class="info-label">Caducidad</label>
              <ion-input type="date" class="info-input" v-model="quickExpirationDateInput" :disabled="loading" />
            </div>
          </div>

          <div class="info-actions">
            <ion-button
              expand="block"
              fill="outline"
              class="btn-info-cancel"
              @click="requestCloseQuickCreateModal"
              :disabled="loading"
            >
              <span class="material-icons">close</span> Cancelar
            </ion-button>

            <ion-button
              expand="block"
              class="btn-info-save"
              @click="confirmQuickCreate"
              :disabled="loading"
            >
              Crear
            </ion-button>
          </div>
        </div>

        <div v-if="loading" class="modal-saving-overlay">
          <ion-spinner name="crescent" style="transform:scale(1.6);" />
          <p class="modal-saving-text">Guardando…</p>
        </div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import {
  IonFab,
  IonFabButton,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonList,
  IonItem,
  IonInput,
  IonLabel,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonSpinner
} from '@ionic/vue'
import { addOutline } from 'ionicons/icons'
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  doc,
  increment,
  orderBy,
  limit,
  updateDoc,
  onSnapshot,
  type Unsubscribe
} from 'firebase/firestore'
import { db } from '@/firebase'
import { showToast } from '@/composables/showToast'
import { getOptimizedUrl, isImageGalery, getInitial } from '@/composables/itemUtils'
import type { Item } from '@/models/item'
import type { ComunItem } from '@/models/comunItem'
import type { Location } from '@/models/location'

const props = defineProps<{
  pantryCode: string
  items: Item[]
  view: 'inventory' | 'purcharse'
}>()

const emit = defineEmits<{
  (e: 'willOpen'): void
}>()

const isCreateOpen = ref(false)
const newProductName = ref<string>('')
const comunItems = ref<ComunItem[]>([])
const loading = ref<boolean>(false)
const pantryDocId = ref<string | null>(null)

const filterMode = ref<'all' | 'inventory'>('all')

const comunUnsub = ref<Unsubscribe | null>(null)
const localExcludedKeys = ref<string[]>([])

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()

const keyFor = (name: string, imageUrl: string) => `${norm(name)}__${String(imageUrl ?? '')}`

const excludedKeysSet = computed(() => {
  const set = new Set<string>()

  for (const i of props.items ?? []) {
    const n = String(i?.name ?? '')
    const img = String(i?.imageUrl ?? '')
    set.add(keyFor(n, img))
  }

  for (const k of localExcludedKeys.value ?? []) {
    set.add(k)
  }

  return set
})

const comunItemsAvailable = computed(() => {
  const excluded = excludedKeysSet.value
  return (comunItems.value ?? []).filter(ci => !excluded.has(keyFor(ci.name, ci.imageUrl)))
})

const comunItemsFiltered = computed(() => {
  const q = norm(newProductName.value)
  const base = comunItemsAvailable.value
  if (!q) return base
  return base.filter(it => norm(it.name).includes(q))
})

// items del inventario que NO están en compra
const inventoryNotInPurchaseFiltered = computed<Item[]>(() => {
  const base = (props.items ?? []).filter(it => !it.inPurchase)
  const q = norm(newProductName.value)
  if (!q) return base
  return base.filter(it => norm(it.name).includes(q))
})

// Lista combinada (solo se usa en vista "purcharse")
const combinedItems = computed(() => {
  const commons = comunItemsFiltered.value.map(c => ({
    kind: 'common' as const,
    id: c.id,
    name: c.name,
    imageUrl: c.imageUrl
  }))
  const inv = inventoryNotInPurchaseFiltered.value.map(i => ({
    kind: 'inventory' as const,
    id: i.id,
    name: i.name,
    imageUrl: i.imageUrl
  }))

  let merged = [...commons, ...inv]

  if (filterMode.value === 'inventory') {
    merged = merged.filter(i => i.kind === 'inventory')
  }

  merged.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))

  return merged
})

const modalTitle = computed(() =>
  props.view === 'purcharse' ? 'Crear producto en compra' : 'Crear producto'
)

const fabAriaLabel = computed(() =>
  props.view === 'purcharse' ? 'Crear producto en compra' : 'Crear producto'
)
const modalSubtitle = computed(() =>
  props.view === 'purcharse' ? 'Añade productos a tu compra' : 'Añade productos a tu despensa'
)

const defaultInPurchase = computed<boolean>(() => props.view === 'purcharse')

function stopComunItemsListener() {
  if (comunUnsub.value) {
    comunUnsub.value()
    comunUnsub.value = null
  }
}

function startComunItemsListener() {
  stopComunItemsListener()
  loading.value = true

  const q = query(collection(db, 'comun_items'), orderBy('name', 'asc'))

  comunUnsub.value = onSnapshot(
    q,
    snap => {
      comunItems.value = snap.docs.map(d => {
        const data = d.data() as any
        return {
          id: String(d.id),
          name: String(data?.name ?? ''),
          imageUrl: String(data?.imageUrl ?? '')
        } as ComunItem
      })
      loading.value = false
    },
    async err => {
      console.error('Error al escuchar productos comunes:', err)
      loading.value = false
      await showToast('Error al cargar los productos sugeridos.', 'danger')
    }
  )
}

// Modal crear producto
function openCreateModal() {
  filterMode.value = 'all'
  localExcludedKeys.value = []
  isCreateOpen.value = true
  startComunItemsListener()
}

function closeCreateModal() {
  isCreateOpen.value = false
  newProductName.value = ''
  localExcludedKeys.value = []
  stopComunItemsListener()
}

// Confirmamos creación desde el modal
async function confirmCreate() {
  await addItemFromPantry(newProductName.value, '')
  if (newProductName.value.trim()) {
    clearInput()
  }
}

function clearInput() {
  newProductName.value = ''
}

// Añade un nuevo item a la despensa (crea documento nuevo)
async function addItemFromPantry(nameItem: string, imageUrl: string) {
  const name = (nameItem ?? '').trim()
  if (!name) {
    await showToast('Escribe un nombre de producto.', 'danger')
    return
  }

  loading.value = true
  try {
    // Comprobar que no exista ya un item con ese nombre Y misma imagen en la despensa
    // (si tiene mismo nombre pero distinta imagen, SÍ se permite crear)
    const dupQ = query(
      collection(db, 'items'),
      where('pantryCode', '==', props.pantryCode),
      where('name', '==', name)
    )
    const dupSnap = await getDocs(dupQ)

    const existsSameNameAndImage =
      !dupSnap.empty &&
      dupSnap.docs.some(d => {
        const data = d.data() as any
        const existingImg = String(data?.imageUrl ?? '')
        const newImg = String(imageUrl ?? '')
        return existingImg === newImg
      })

    if (existsSameNameAndImage) {
      await showToast(`El producto ${name} ya existe en la despensa.`, 'danger')
      return
    }

    const batch = writeBatch(db)
    const newItemRef = doc(collection(db, 'items'))
    const itemName = name.charAt(0).toUpperCase() + name.slice(1)

    batch.set(newItemRef, {
      name: itemName,
      pantryCode: props.pantryCode,
      quantity: (defaultInPurchase?.value === true) ? 0 : 1,
      unit: 'Unidad',
      inPurchase: defaultInPurchase.value,
      imageUrl: imageUrl
    })

    const pantryRef = await getPantryRefByCode()
    batch.update(pantryRef, { totalItems: increment(1) })

    await batch.commit()

    // Ocultar al instante el común añadido (sin depender de que el padre refresque)
    if (imageUrl !== undefined) {
      const k = keyFor(name, String(imageUrl ?? ''))
      if (!localExcludedKeys.value.includes(k)) {
        localExcludedKeys.value = [...localExcludedKeys.value, k]
      }
    }

    await showToast(`Producto ${name} añadido.`, 'success')
  } catch (err) {
    console.error('Error al añadir producto:', err)
    await showToast(`No se pudo añadir el producto ${name}.`, 'danger')
  } finally {
    loading.value = false
    clearInput()
  }
}

// Marca un item existente como en compra (inPurchase = true)
async function addExistingToPurchase(itemId: string) {
  try {
    const refItem = doc(db, 'items', itemId)
    await updateDoc(refItem, { inPurchase: true })
    const found = (props.items ?? []).find(i => i.id === itemId)
    await showToast(`Producto ${found?.name ?? ''} añadido a la compra.`, 'success')
  } catch (err) {
    console.error('Error al añadir producto existente a la compra:', err)
    await showToast('No se pudo añadir el producto a la compra.', 'danger')
  } finally {
    loading.value = false
    clearInput()
  }
}

// Obtenemos el identificador del documento de la despensa actual
async function getPantryRefByCode() {
  if (pantryDocId.value) return doc(db, 'pantries', pantryDocId.value)

  const q = query(collection(db, 'pantries'), where('code', '==', props.pantryCode), limit(1))
  const snap = await getDocs(q)
  if (snap.empty) throw new Error(`No existe la despensa con code ${props.pantryCode}`)

  pantryDocId.value = snap.docs[0].id
  return snap.docs[0].ref
}

// Si se abre/cierra por otras vías, arrancamos/pararmos listener
watch(isCreateOpen, open => {
  if (open) {
    startComunItemsListener()
  } else {
    stopComunItemsListener()
  }
})

onBeforeUnmount(() => {
  stopComunItemsListener()
  stopLocationsListener()
})

const isQuickCreateOpen = ref(false)
const quickName = ref<string>('')
const quickImageUrl = ref<string>('')
const quickQuantity = ref<number | null>(null)
const quickUnit = ref<string>('Unidad')
const quickLocation = ref<Location | null>(null)
const quickExpirationDate = ref<string | null>(null)

const quickExpirationDateInput = computed<string>({
  get: () => quickExpirationDate.value ?? '',
  set: (v: string) => {
    const s = String(v ?? '').trim()
    quickExpirationDate.value = s ? s : null
  }
})

const unitOptions = ['Unidad', 'Kilogramo', 'Gramo', 'Litro', 'Mililitro']

const locations = ref<Location[]>([])
const locationsUnsub = ref<Unsubscribe | null>(null)

function stopLocationsListener() {
  if (locationsUnsub.value) {
    locationsUnsub.value()
    locationsUnsub.value = null
  }
}

function startLocationsListener() {
  stopLocationsListener()
  const q = query(collection(db, 'locations'), orderBy('name', 'asc'))
  locationsUnsub.value = onSnapshot(
    q,
    snap => {
      locations.value = snap.docs.map(d => {
        const loc = d.data() as any
        return {
          id: String(d.id),
          name: String(loc.name ?? '')
        } as Location
      })
    },
    async err => {
      console.error('Error al obtener localizaciones:', err)
      await showToast('Error al cargar las localizaciones.', 'danger')
    }
  )
}

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

function changeQuickQuantity(deltaSign: 1 | -1) {
  const unitToUse = quickUnit.value || 'Unidad'
  const step = getStepForUnit(unitToUse)
  const current = quickQuantity.value ?? 0
  const newQty = getAdjustedQuantity(current, step, deltaSign, 0)
  quickQuantity.value = newQty
}

function openQuickCreateFromCommon(nameItem: string, imageUrl: string) {
  const name = (nameItem ?? '').trim()
  if (!name) return

  quickName.value = name
  quickImageUrl.value = String(imageUrl ?? '')
  quickUnit.value = 'Unidad'
  quickLocation.value = null
  quickExpirationDate.value = null
  quickQuantity.value = defaultInPurchase.value ? 0 : 1

  startLocationsListener()
  isQuickCreateOpen.value = true
}

function requestCloseQuickCreateModal() {
  isQuickCreateOpen.value = false
}

function onQuickCreateDidDismiss() {
  isQuickCreateOpen.value = false
  quickName.value = ''
  quickImageUrl.value = ''
  quickQuantity.value = null
  quickUnit.value = 'Unidad'
  quickLocation.value = null
  quickExpirationDate.value = null
  stopLocationsListener()
}

async function confirmQuickCreate() {
  const name = (quickName.value ?? '').trim()
  if (!name) {
    await showToast('Escribe un nombre de producto.', 'danger')
    return
  }

  if (quickQuantity.value == null || Number.isNaN(quickQuantity.value)) {
    await showToast('Introduce una cantidad válida.', 'danger')
    return
  }

  const qty = Number(quickQuantity.value)
  if (qty < 0) {
    await showToast('La cantidad no puede ser negativa.', 'danger')
    return
  }

  const unit = String(quickUnit.value ?? 'Unidad')
  const imageUrl = String(quickImageUrl.value ?? '')
  const expirationToSave = quickExpirationDate.value ? quickExpirationDate.value.trim() : null
  const locationIdToSave = quickLocation.value ? quickLocation.value.id : null

  loading.value = true
  try {
    const dupQ = query(
      collection(db, 'items'),
      where('pantryCode', '==', props.pantryCode),
      where('name', '==', name)
    )
    const dupSnap = await getDocs(dupQ)

    const existsSameNameAndImage =
      !dupSnap.empty &&
      dupSnap.docs.some(d => {
        const data = d.data() as any
        const existingImg = String(data?.imageUrl ?? '')
        const newImg = String(imageUrl ?? '')
        return existingImg === newImg
      })

    if (existsSameNameAndImage) {
      await showToast(`El producto ${name} ya existe en la despensa.`, 'danger')
      return
    }

    const batch = writeBatch(db)
    const newItemRef = doc(collection(db, 'items'))
    const itemName = name.charAt(0).toUpperCase() + name.slice(1)

    batch.set(newItemRef, {
      name: itemName,
      pantryCode: props.pantryCode,
      quantity: qty,
      unit: unit,
      inPurchase: defaultInPurchase.value,
      imageUrl: imageUrl,
      locationId: locationIdToSave,
      expirationDate: expirationToSave
    })

    const pantryRef = await getPantryRefByCode()
    batch.update(pantryRef, { totalItems: increment(1) })

    await batch.commit()

    const k = keyFor(name, String(imageUrl ?? ''))
    if (!localExcludedKeys.value.includes(k)) {
      localExcludedKeys.value = [...localExcludedKeys.value, k]
    }

    await showToast(`Producto ${name} añadido.`, 'success')
    requestCloseQuickCreateModal()
  } catch (err) {
    console.error('Error al añadir producto:', err)
    await showToast(`No se pudo añadir el producto ${name}.`, 'danger')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* BOTON FLOTANTE AÑADIR */
.add-button {
  --background: var(--md-accent, #2ea15d);
  --color: #ffffff;
}

/* HEADER MODAL */
.create-modal-toolbar {
  --background: var(--md-accent, #2ea15d);
  --border-width: 0;
}

.create-modal-title {
  --color: #ffffff;
  font-size: 18px;
  font-weight: 700;
}

.create-modal-close-btn {
  --color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
}

/* CONTENIDO MODAL + FORMULARIO */
.create-modal-content {
  --background: var(--ion-background-color);
}

.create-modal-item {
  margin-top: 12px;
  padding-inline: 5px;
}

.create-modal-label {
  margin-left: 2%;
  color: var(--ion-text-color);
  font-size: 19px;
  font-weight: 700;
}

.create-modal-input {
  margin-top: 4%;

  --background: var(--ion-background-color2);
  --padding-start: 12px;
  --padding-end: 12px;
  --padding-top: 10px;
  --padding-bottom: 10px;

  border: 1px solid var(--ion-border-color);
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

  overflow: hidden;
}

.create-modal-actions {
  display: flex;
  gap: 10px;
  margin: 16px 16px 0;
}

/* BOTONES CANCELAR Y CREAR PRODUCTO */
.btn-cancel-outline {
  flex: 1;
  --background: transparent;
  --box-shadow: none;
  --color: var(--md-accent, #2ea15d);
  font-weight: 600;
  text-transform: uppercase;
}

.btn-create-solid {
  flex: 1;
  --background: var(--md-accent, #2ea15d);
  --color: #ffffff;

  border-radius: 8px;
  font-weight: 600;
  text-transform: uppercase;
}

/* PRODUCTOS SUGERIDOS */
.suggested-wrapper {
  margin-top: 24px;
}

.suggested-title {
  margin: 0 0 10px;
  font-size: 16px;
  font-weight: 700;
}

.suggested-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 12px;
}

.suggested-card {
  display: flex;
  flex-direction: column;
  text-align: center;
  padding: 8px;

  border-radius: 12px;
  border: 1px solid var(--ion-border-color);
  background: var(--ion-background-color);
}

/* IMAGEN PRODUCTO */
.suggested-img {
  width: 60px;
  height: 60px;
  margin: 0 auto 8px;
  display: block;
  align-self: center;
  object-fit: contain;
}

/* IMAGEN GALERÍA */
.suggested-card img.img-galery {
  width: 70%;
  margin: 0 auto 8px;
  display: block;

  border-radius: 5%;
  object-fit: cover;
}

/* LETRA (cuando no hay imagen) */
.suggested-letter {
  width: 60px;
  height: 60px;
  margin: 0 auto 8px;

  display: grid;
  place-items: center;

  border-radius: 12px;
  border: 1px solid var(--ion-border-color);

  font-family: "Risque", serif;
  font-weight: 400;
  line-height: 1;
  letter-spacing: 0;
  font-size: 44px;

  color: var(--md-accent, #2ea15d);
  background: color-mix(in srgb, var(--ion-background-color) 88%, var(--md-accent, #2ea15d) 12%);
}

body.dark .suggested-letter {
  border-color: #333333;
  background: color-mix(in srgb, var(--ion-background-color) 85%, var(--md-accent, #2ea15d) 15%);
}

.suggested-name {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.2;

  min-height: calc(2 * 1.2em);
  overflow: hidden;
}

.suggested-card .btn-add {
  margin-top: auto;
  align-self: stretch;
}

.btn-add {
  --background: var(--md-accent, #2ea15d);
  --color: #ffffff;

  height: 33px;
  border-radius: 8px;
  font-weight: 600;
  text-transform: none;
}

/* FILTO DE PRODUCTOS (RADIOBUTTONS) */
.filter-radios {
  margin: 16px 4px 22px;
}

.filter-radios.mydict > div {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.filter-radios.mydict input[type='radio'] {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  white-space: nowrap;
  clip: rect(0 0 0 0);
  clip-path: inset(100%);
}

.filter-radios.mydict input[type='radio']:focus + span {
  outline: 0;
  border-color: var(--md-accent, #2ea15d);
  box-shadow: 0 0 0 4px color-mix(in srgb, #ffffff 80%, var(--md-accent, #2ea15d) 20%);
}

.filter-radios.mydict label span {
  display: block;
  cursor: pointer;
  padding: 0.3em 0.8em;

  background-color: var(--ion-background-color);
  box-shadow: 0 0 0 0.0625em color-mix(in srgb, #ffffff 35%, var(--md-accent, #2ea15d) 25%);

  font-size: 17px;
  letter-spacing: 0.05em;
  text-align: center;

  color: color-mix(in srgb, #ffffff 55%, var(--md-accent, #2ea15d) 45%);
  transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.filter-radios.mydict label:first-child span {
  border-radius: 0.375em 0 0 0.375em;
}

.filter-radios.mydict label:last-child span {
  border-radius: 0 0.375em 0.375em 0;
}

.filter-radios.mydict input[type='radio']:checked + span {
  z-index: 1;
  color: var(--md-accent, #2ea15d);
  box-shadow: 0 0 0 0.0625em var(--md-accent, #2ea15d);
  background-color: color-mix(in srgb, #ffffff 80%, var(--md-accent, #2ea15d) 20%);
}

body.dark .filter-radios.mydict input[type='radio']:checked + span {
  background-color: rgba(46, 161, 94, 0.1);
  color: color-mix(in srgb, #ffffff 92%, var(--md-accent, #2ea15d) 8%);
  box-shadow: 0 0 0 0.0625em var(--md-accent, #2ea15d);
}

/* SIN RESULTADOS */
.empty {
  flex: 1;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  padding: 24px 16px;
  text-align: center;

  color: #6b7280;
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
  color: var(--ion-text-color3);
}

.empty-title {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 700;
  color: var(--ion-text-color3);
}

.empty-subtitle {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--ion-text-color2);
}

/* Loading */
.loading-box {
  display: grid;
  place-content: center;
  min-height: 40vh;
}

/* FIX MODALES (editar + mover) */
.product-info-modal::part(content) {
  width: min(360px, 90%);
  max-height: 70%;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
  background: var(--ion-background-color);
}

body.dark .product-info-modal::part(content) {
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

.info-product-image-wrapper img.info-img-galery {
  object-fit: cover;
  border-radius: 14px;
}

.modal-item-letter{
  width: 100px;
  height: 100px;

  display: grid;
  place-items: center;

  border-radius: 16px;
  border: 1px solid color-mix(in srgb, #ffffff 65%, var(--md-accent, #2ea15d) 35%);
  background: color-mix(in srgb, #ffffff 88%, var(--md-accent, #2ea15d) 12%);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);

  color: var(--md-accent, #2ea15d);

  font-family: "Risque", serif;
  font-weight: 400;
  font-size: 72px;
  line-height: 1;

  position: relative;
}

.info-product-name {
  margin-top: 4%;
  font-size: 18px;
  font-weight: 600;
  color: var(--ion-text-color);
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
  color: var(--ion-text-color2);
}

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

.qty-inline-btn {
  margin: 0;
  --padding-start: 0;
  --padding-end: 0;
  --padding-top: 0;
  --padding-bottom: 0;
}

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