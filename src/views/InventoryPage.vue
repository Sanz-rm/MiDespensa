<template>
  <ion-page>
    <InventoryAndPurcharseHeader :title="`Inventario de ${props.name}`" backRouteName="home" />

    <ion-content ref="contentRef" class="ion-padding pantry-content" :scroll-events="true" @ionScroll="onContentScroll">
      <!-- Buscador START -->
      <div class="actions">
        <ion-searchbar v-model="search" placeholder="Buscar producto…" :debounce="150" show-clear-button="focus" />

        <!-- Selector de vista START -->
        <div class="view-toggle" role="group" aria-label="Modo de visualización">
          <ion-segment v-model="viewMode" mode="md" class="view-segment" @ionChange="onViewModeChange">
            <ion-segment-button value="general" class="view-segment-btn">
              <div class="seg-content">
                <ion-icon :icon="gridOutline" />
                <span class="seg-text">General</span>
              </div>
            </ion-segment-button>

            <ion-segment-button value="list" class="view-segment-btn">
              <div class="seg-content">
                <ion-icon :icon="listOutline" />
                <span class="seg-text">Listado</span>
              </div>
            </ion-segment-button>

          </ion-segment>
        </div>
        <!-- Selector de vista END -->
      </div>
      <!-- Buscador END -->

      <!-- Loading START -->
      <div v-if="loading" class="loading-box">
        <ion-spinner name="crescent" style="transform:scale(2);" />
      </div>
      <!-- Loading END -->

      <!-- Productos de la despensa seleccionada START -->
      <div v-if="!loading && itemsFiltered.length">
        <!-- VISTA GENERAL START -->
        <div v-if="viewMode === 'general'" class="items-grid">
          <div v-for="item in itemsFiltered" :key="item.id" :ref="(el) => setItemCardRef(item.id, el)" class="item-card"
            :class="{ 'item-card-expiring': isExpiringSoon(item) }" @click="openInfoModal(item)">
            <!-- BOTÓN MOVER START -->
            <ion-button class="move-btn" fill="clear" size="small" aria-label="Mover producto"
              @click.stop="openMoveModal(item)">
              <ion-icon :icon="swapHorizontalOutline" />
            </ion-button>
            <!-- BOTÓN MOVER END -->

            <!-- BOTÓN ELIMINAR START -->
            <ion-button class="delete-btn" fill="clear" size="small" aria-label="Eliminar producto"
              @click.stop="deleteItemFromPantry(item)">
              <ion-icon :icon="trashOutline" />
            </ion-button>
            <!-- BOTÓN ELIMINAR END -->

            <img v-if="item.imageUrl" :src="getOptimizedUrl(item.imageUrl)" :alt="item.name"
              :class="{ 'img-galery': isImageGalery(item.imageUrl) }" />

            <div v-else class="item-letter" aria-hidden="true">
              {{ getInitial(item.name) }}
            </div>

            <p class="item-name">{{ item.name }}</p>

            <!-- UNIDADES + CONTROLES START -->
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
            <!-- UNIDADES + CONTROLES END -->

            <!-- ACCIONES START -->
            <div class="card-actions">
              <ion-button size="small" :class="item.inPurchase ? 'btn-remove' : 'btn-add'"
                @click.stop="togglePurchaseState(item)">
                <ion-icon :icon="cartOutline" slot="start" />
                {{ item.inPurchase ? 'Quitar de compra' : 'Añadir a compra' }}
              </ion-button>
            </div>
            <!-- ACCIONES END -->
          </div>
        </div>
        <!-- VISTA GENERAL END -->

        <!-- VISTA LISTADO START -->
        <div v-else class="list-cards">
          <div v-for="item in itemsFiltered" :key="item.id" :ref="(el) => setItemCardRef(item.id, el)" class="item-row"
            :class="{ 'item-row-expiring': isExpiringSoon(item) }" @click="openInfoModal(item)">
            <!-- IMAGEN + NOMBRE START -->
            <div class="row-left">
              <img v-if="item.imageUrl" class="icon" :src="getOptimizedUrl(item.imageUrl)" :alt="item.name"
                :class="{ 'img-galery': isImageGalery(item.imageUrl) }" />
              <div v-else class="icon-letter" aria-hidden="true">
                {{ getInitial(item.name) }}
              </div>
              <!-- IMAGEN + NOMBRE END -->

              <div class="info">
                <p class="name">{{ item.name }}</p>

                <!-- UNIDADES + CONTROLES START -->
                <div class="row-units">
                  <ion-button fill="clear" size="small" class="qty-btn qty-btn-row"
                    @click.stop="adjustItemQuantity(item, -1)">
                    <span class="material-icons">remove</span>
                  </ion-button>

                  <span class="units-value">
                    {{ item.quantity }} {{ getMeasurementUnitAbbr(item.unit) }}
                  </span>

                  <ion-button fill="clear" size="small" class="qty-btn qty-btn-row"
                    @click.stop="adjustItemQuantity(item, 1)">
                    <span class="material-icons">add</span>
                  </ion-button>
                </div>
                <!-- UNIDADES + CONTROLES END -->
              </div>
            </div>

            <!-- ACCIONES START -->
            <div class="row-actions" @click.stop>
              <ion-button size="small" class="icon-action purchase-action"
                :class="item.inPurchase ? 'btn-remove' : 'btn-add'" aria-label="Añadir o quitar de compra"
                @click.stop="togglePurchaseState(item)">
                <ion-icon :icon="cartOutline" />
              </ion-button>

              <ion-button size="small" class="icon-action move-action" fill="clear" aria-label="Mover producto"
                @click.stop="openMoveModal(item)">
                <ion-icon :icon="swapHorizontalOutline" />
              </ion-button>

              <ion-button size="small" class="icon-action delete-action" fill="clear" aria-label="Eliminar producto"
                @click.stop="deleteItemFromPantry(item)">
                <ion-icon :icon="trashOutline" />
              </ion-button>
            </div>
            <!-- ACCIONES END -->
          </div>
        </div>
        <!-- VISTA LISTADO END -->
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

      <!-- Barra alfabética (scroll rápido) START -->
      <div class="alpha-bar" :class="{ 'alpha-bar--visible': showAlphaBar }" @pointerdown.prevent="onAlphaPointerDown"
        @pointermove.prevent="onAlphaPointerMove" @pointerup="onAlphaPointerUp" @pointercancel="onAlphaPointerUp">
        <div v-for="l in alphabet" :key="l" class="alpha-letter" :class="{ 'alpha-letter--active': activeLetter === l }"
          :data-letter="l">
          {{ l }}
        </div>
      </div>
      <!-- Barra alfabética END -->

      <!-- Botón flotante START -->
      <ModalAddProduct :pantry-code="props.code" :items="items" view="inventory" @willOpen="search = ''" />
      <!-- Botón flotante END -->

      <!-- Modal info producto START (NO TOCADO) -->
      <ion-modal :is-open="isInfoOpen" css-class="product-info-modal" @didDismiss="onInfoDidDismiss"
        :backdropDismiss="!savingItem" :canDismiss="!savingItem">
        <ion-content class="product-info-content" v-if="selectedItem">
          <div class="product-info-wrapper">
            <h3 class="info-title">INFORMACIÓN DE PRODUCTO</h3>

            <div class="info-product-block">
              <div class="info-product-image-wrapper" @click="!savingItem && pickImage(selectedItem)">
                <img v-if="selectedItem.imageUrl" :src="getOptimizedUrl(selectedItem.imageUrl)" :alt="selectedItem.name"
                  :class="{ 'info-img-galery': isImageGalery(selectedItem.imageUrl) }" />

                <div v-else class="modal-item-letter" aria-hidden="true">
                  {{ getInitial(selectedItem.name) }}
                </div>

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
                      <span class="material-icons" style="color: var(--ion-text-color4);">remove</span>
                    </ion-button>

                    <ion-input type="number" inputmode="numeric" v-model.number="editQuantity"
                      class="info-input-exception qty-input qty-inline-input" :disabled="savingItem" />

                    <ion-button fill="clear" size="small" class="qty-btn qty-btn-modal qty-btn-plus qty-inline-btn"
                      @click="changeEditQuantity(1)" :disabled="savingItem">
                      <span class="material-icons" style="color: var(--ion-text-color4);">add</span>
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
                <ion-button expand="block" fill="outline" class="btn-info-cancel" @click="requestCloseInfoModal"
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
      <ion-modal :is-open="isMoveOpen" css-class="move-product-modal" @didDismiss="onMoveDidDismiss"
        :backdropDismiss="!movingItem" :canDismiss="!movingItem">
        <ion-content class="product-info-content" v-if="moveItem">
          <div class="product-info-wrapper">
            <h3 class="info-title">MOVER PRODUCTO</h3>

            <div class="info-product-block">
              <div class="info-product-image-wrapper">
                <img v-if="moveItem.imageUrl" :src="getOptimizedUrl(moveItem.imageUrl)" :alt="moveItem.name"
                  :class="{ 'info-img-galery': isImageGalery(moveItem.imageUrl) }" />

                <div v-else class="modal-item-letter" aria-hidden="true">
                  {{ getInitial(moveItem.name) }}
                </div>
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
                      <span class="material-icons" style="color: var(--ion-text-color4);">remove</span>
                    </ion-button>

                    <ion-input type="number" inputmode="numeric" v-model.number="moveQuantity"
                      class="info-input-exception qty-input qty-inline-input" :disabled="movingItem" />

                    <ion-button fill="clear" size="small" class="qty-btn qty-btn-modal qty-btn-plus qty-inline-btn"
                      @click="changeMoveQuantity(1)" :disabled="movingItem">
                      <span class="material-icons" style="color: var(--ion-text-color4);">add</span>
                    </ion-button>
                  </div>

                  <small class="info-helper"> Mínimo 1, máximo {{ moveMaxQuantity }} </small>
                </div>

                <div class="info-field">
                  <label class="info-label">Unidad</label>
                  <ion-input :value="moveItem.unit" class="info-input info-input-readonly" readonly />
                </div>
              </div>

              <div class="info-actions">
                <ion-button expand="block" fill="outline" class="btn-info-cancel" @click="requestCloseMoveModal"
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
import {
  IonPage,
  IonContent,
  IonSpinner,
  IonButton,
  IonIcon,
  IonSearchbar,
  IonModal,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonSegment,
  IonSegmentButton
} from '@ionic/vue'
import { cartOutline, trashOutline, swapHorizontalOutline, gridOutline, listOutline } from 'ionicons/icons'
import type { Item } from '@/models/item'
import type { Location } from '@/models/location'
import type { Pantry } from '@/models/pantry'
import { onMounted, onBeforeUnmount, ref, computed, inject, watch, type Ref, nextTick } from 'vue'
import {
  collection,
  query,
  where,
  updateDoc,
  doc,
  getDocs,
  writeBatch,
  increment,
  onSnapshot,
  limit,
  type Unsubscribe,
  orderBy
} from 'firebase/firestore'
import { db } from '@/firebase'
import { showToast } from '@/composables/showToast'
import { getMeasurementUnit, getMeasurementUnitAbbr, getOptimizedUrl, isImageGalery, getInitial } from '@/composables/itemUtils'
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

// -----------------------------
// Vista: general/list (persistencia localStorage)
// -----------------------------
type InventoryViewMode = 'general' | 'list'
const INVENTORY_VIEW_KEY = 'inventoryViewMode'
const viewMode = ref<InventoryViewMode>('general')

function loadViewMode() {
  try {
    const v = localStorage.getItem(INVENTORY_VIEW_KEY)
    if (v === 'general' || v === 'list') viewMode.value = v
  } catch {
    viewMode.value = 'general'
  }
}

function persistViewMode(mode: InventoryViewMode) {
  try {
    localStorage.setItem(INVENTORY_VIEW_KEY, mode)
  } catch { 
    console.log("Error al modificar el tipo de vista en el storage")
  }
}

function onViewModeChange() {
  persistViewMode(viewMode.value)
}

// -----------------------------
// 1) Mantener scroll al cerrar modales (editar / mover)
// -----------------------------
type IonContentEl = HTMLElement & {
  getScrollElement: () => Promise<HTMLElement>
  scrollToPoint: (x: number, y: number, duration: number) => Promise<void>
}

const contentRef = ref<any>(null)

const showAlphaBar = ref(false)
let alphaHideTimer: ReturnType<typeof setTimeout> | null = null

function scheduleHideAlphaBar() {
  if (alphaHideTimer) clearTimeout(alphaHideTimer)
  alphaHideTimer = setTimeout(() => {
    // Si el usuario está arrastrando la barra, no la escondas aún
    if (!alphaDragging.value) showAlphaBar.value = false
  }, 2000)
}

function onContentScroll() {
  // Al hacer scroll, la mostramos y reprogramamos el hide
  showAlphaBar.value = true
  scheduleHideAlphaBar()
}

function getIonContentEl(): IonContentEl | null {
  const r = contentRef.value
  // En Ionic Vue el ref suele ser un proxy -> el webcomponent real está en $el
  return ((r?.$el ?? r) as IonContentEl) ?? null
}

async function getScrollEl(): Promise<HTMLElement | null> {
  try {
    const el = getIonContentEl()
    if (!el?.getScrollElement) return null
    return await el.getScrollElement()
  } catch {
    return null
  }
}

const itemCardEls = ref<Record<string, HTMLElement>>({})
const savedScrollTop = ref<number>(0)
const savedItemId = ref<string | null>(null)
const savedItemOffset = ref<number>(0)

function setItemCardRef(id: string, el: any) {
  if (!id) return
  const node = (el?.$el ?? el) as HTMLElement | null

  if (node) {
    itemCardEls.value[id] = node
  } else {
    const copy = { ...itemCardEls.value }
    delete copy[id]
    itemCardEls.value = copy
  }
}

function calcOffsetTopWithinScroll(target: HTMLElement, scrollEl: HTMLElement): number {
  let y = 0
  let el: HTMLElement | null = target
  while (el && el !== scrollEl) {
    y += el.offsetTop || 0
    el = el.offsetParent as HTMLElement | null
  }
  return y
}

// Guardamos scroll justo al abrir un modal desde un item
async function saveScrollSnapshot(itemId: string) {
  const scrollEl = await getScrollEl()
  if (!scrollEl) return

  savedScrollTop.value = scrollEl.scrollTop
  savedItemId.value = itemId

  const el = itemCardEls.value[itemId]
  if (el) {
    const elTop = calcOffsetTopWithinScroll(el, scrollEl)
    // Offset del item respecto al viewport del scroll (para que al volver quedeă quede en el mismo sitio)
    savedItemOffset.value = elTop - scrollEl.scrollTop
  } else {
    savedItemOffset.value = 0
  }
}

// Restauramos scroll al cerrar el modal (guardar o cancelar)
async function restoreScrollSnapshot() {
  const c = getIonContentEl()
  const scrollEl = await getScrollEl()
  if (!c || !scrollEl) return

  await nextTick()

  const id = savedItemId.value
  const el = id ? itemCardEls.value[id] : null

  let targetY = savedScrollTop.value

  if (el && id) {
    const elTop = calcOffsetTopWithinScroll(el, scrollEl)
    targetY = Math.max(0, elTop - savedItemOffset.value)
  }

  try {
    await c.scrollToPoint(0, targetY, 200)
  } catch {
    // fallback (por si scrollToPoint falla por alguna razón)
    scrollEl.scrollTop = targetY
  }
}

// -----------------------------
// 2) Barra alfabética (scroll rápido)
// -----------------------------
const alphabet = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'Ñ', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
]
const activeLetter = ref<string | null>(null)
const alphaDragging = ref(false)

const letterToItemId = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {}
  for (const it of itemsFiltered.value) {
    const first = getLetterKey(it.name)
    if (first && !map[first]) map[first] = it.id
  }
  return map
})

function getLetterKey(name: string): string {
  const raw = String(name ?? '').trim()
  if (!raw) return ''
  // Normalizamos acentos para agrupar (Á -> A)
  const n = raw.normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase()
  const c = n.charAt(0)
  // Si el nombre empieza por Ñ “real”, lo detectamos antes de normalizar (si quieres)
  if (raw.trim().toUpperCase().startsWith('Ñ')) return 'Ñ'
  // Si no es letra, devolvemos '#'(pero aquí no la usamos)
  if (!/[A-Z]/.test(c)) return ''
  return c
}

async function scrollToItemId(itemId: string) {
  const c = getIonContentEl()
  const scrollEl = await getScrollEl()
  if (!c || !scrollEl) return

  const el = itemCardEls.value[itemId]
  if (!el) return

  const y = calcOffsetTopWithinScroll(el, scrollEl)
  await c.scrollToPoint(0, Math.max(0, y - 8), 120)
}

async function scrollToLetter(letter: string) {
  const id = letterToItemId.value[letter]
  if (!id) return
  activeLetter.value = letter
  await scrollToItemId(id)
}

function letterFromPointerEvent(ev: PointerEvent): string | null {
  const target = ev.currentTarget as HTMLElement | null
  if (!target) return null

  const rect = target.getBoundingClientRect()
  const y = Math.min(Math.max(ev.clientY - rect.top, 0), rect.height)

  const itemH = rect.height / alphabet.length
  const idx = Math.min(alphabet.length - 1, Math.max(0, Math.floor(y / itemH)))

  return alphabet[idx] ?? null
}

function onAlphaPointerDown(ev: PointerEvent) {
  alphaDragging.value = true
  showAlphaBar.value = true
  if (alphaHideTimer) clearTimeout(alphaHideTimer)

  const l = letterFromPointerEvent(ev)
  if (l) scrollToLetter(l)
}

function onAlphaPointerMove(ev: PointerEvent) {
  if (!alphaDragging.value) return
  const l = letterFromPointerEvent(ev)
  if (l && l !== activeLetter.value) scrollToLetter(l)
}

function onAlphaPointerUp() {
  alphaDragging.value = false
  scheduleHideAlphaBar()

  setTimeout(() => (activeLetter.value = null), 250)
}

// -----------------------------
// Datos / listeners
// -----------------------------
let stopItems: Unsubscribe | null = null
let stopLocations: Unsubscribe | null = null
const items = ref<Item[]>([])
const locations = ref<Location[]>([])

// Despensas reales obtenidas por códigos guardados en localStorage
const pantries = ref<Pantry[]>([])

const destinationPantries = computed(() => pantries.value.filter(p => p.code !== props.code))

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
  loadViewMode()
  getPantryItems(props.code)
  loadPantries()
})

// Al cerrar la ventana dejaremos de escuchar a firestore
onBeforeUnmount(() => {
  if (alphaHideTimer) clearTimeout(alphaHideTimer)
  stopItems?.()
  stopLocations?.()
})

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
  return d <= 3
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

    const qPantries = query(collection(db, 'pantries'), where('code', 'in', codesList), orderBy('name', 'asc'))

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

// HELPERS DE CANTIDAD
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

// Ajuste de cantidad directo en la card/listado
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
  // Guardamos scroll antes de abrir
  await saveScrollSnapshot(item.id)

  selectedItem.value = item
  editQuantity.value = item.quantity
  editUnit.value = item.unit || 'Unidad'
  editExpirationDate.value = (item as any).expirationDate ?? null
  getLocations(item.locationId || null)
  isInfoOpen.value = true
}

// Cerrar modal (por botón) -> solo baja el boolean, el reset real se hace en didDismiss
function requestCloseInfoModal() {
  isInfoOpen.value = false
}

// didDismiss del modal info: reset + restaurar scroll
async function onInfoDidDismiss() {

  // si se cerró por backdrop, tu estado puede seguir en true
  isInfoOpen.value = false

  // Si tenía una imagen en preview sin guardar, la restauramos al cerrar
  if (selectedItem.value) {
    restorePrevImageIfNeeded(selectedItem.value)
  }

  selectedItem.value = null
  editQuantity.value = null
  editUnit.value = 'Unidad'
  editLocation.value = null
  editExpirationDate.value = null
  savingItem.value = false

  // Restaurar scroll donde estaba
  await restoreScrollSnapshot()
}

async function getLocations(locationId: string | null) {
  loading.value = true
  const q = query(collection(db, 'locations'), orderBy('name', 'asc'))

  // Cortamos el listener anterior de locations (si existía)
  stopLocations?.()
  stopLocations = onSnapshot(
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
      const url = await uploadToCloudinary(pendingImageFile.value, pendingImagePublicId.value)
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

      ; (selectedItem.value as any).expirationDate = expirationToSave

    // limpiamos el estado de preview (ya es imagen real)
    clearPrevImageIfNeeded(selectedItem.value)

    await showToast('Producto actualizado.', 'success')
    // Cerrar modal (reset lo hace didDismiss)
    requestCloseInfoModal()
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

  const res = await fetch('https://api.cloudinary.com/v1_1/dpgqmi3zs/image/upload', {
    method: 'POST',
    body: formData
  })

  const data = await res.json()
  return data.secure_url
}

// Recuperamos los items de la despensa seleccionada
async function getPantryItems(pantryCode: string) {
  loading.value = true
  const q = query(collection(db, 'items'), where('pantryCode', '==', pantryCode), orderBy('name', 'asc'))

  stopItems?.()
  stopItems = onSnapshot(
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

  const q = query(collection(db, 'pantries'), where('code', '==', props.code), limit(1))
  const snap = await getDocs(q)
  if (snap.empty) throw new Error(`No existe la despensa con code ${props.code}`)

  pantryDocId.value = snap.docs[0].id
  return snap.docs[0].ref
}

// Obtener ref de una despensa por código genérico (para despensa destino)
async function getPantryRefByCodeGeneric(code: string) {
  const q = query(collection(db, 'pantries'), where('code', '==', code), limit(1))
  const snap = await getDocs(q)
  if (snap.empty) throw new Error(`No existe la despensa con code ${code}`)
  return snap.docs[0].ref
}

// MODAL MOVER PRODUCTO
async function openMoveModal(item: Item) {
  // Guardamos scroll antes de abrir
  await saveScrollSnapshot(item.id)

  moveItem.value = item
  moveMaxQuantity.value = item.quantity
  moveQuantity.value = item.quantity > 0 ? 1 : 0
  selectedPantryCode.value = ''
  isMoveOpen.value = true
}

// Cerrar modal (por botón) -> solo baja el boolean, el reset real se hace en didDismiss
function requestCloseMoveModal() {
  isMoveOpen.value = false
}

// didDismiss del modal mover: reset + restaurar scroll
async function onMoveDidDismiss() {

  // si se cerró por backdrop, tu estado puede seguir en true
  isMoveOpen.value = false

  moveItem.value = null
  selectedPantryCode.value = ''
  moveQuantity.value = null
  moveMaxQuantity.value = 0
  movingItem.value = false

  // Restaurar scroll donde estaba
  await restoreScrollSnapshot()
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
    // Cerrar modal (reset lo hace didDismiss)
    requestCloseMoveModal()
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
  gap: 10px;
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

/* Selector de vista */
.view-toggle {
  width: 100%;
  padding: 2px 6px;
  margin-bottom: 2%;
  border-radius: 12px;
  background: color-mix(in srgb, var(--ion-background-color) 92%, var(--md-accent, #2ea15d) 8%);
  border: 1px solid rgba(112, 112, 112, 0.06);
}

body.dark .view-toggle {
  background: color-mix(in srgb, var(--ion-background-color) 96%, var(--md-accent, #2ea15d) 4%);
  border: 1px solid rgba(112, 112, 112, 0.06);
}

.view-segment {
  --background: transparent;
}


.view-segment-btn {
  --border-radius: 10px;
  --indicator-color: var(--md-accent, #2ea15d);

  --color: var(--md-accent, #2ea15d);
  --color-checked: var(--md-accent, #2ea15d);

  --padding-top: 4px;
  --padding-bottom: 4px;
  --padding-start: 10px;
  --padding-end: 10px;
}

.view-segment-btn::part(native) {
  min-height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.seg-content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  line-height: 1;
}

.seg-content ion-icon {
  font-size: 20px;
  margin: 0;
  position: relative;
  top: 0.5px;
}

.seg-text {
  font-size: 15px;
  font-weight: bolder;
  letter-spacing: 0.2px;
  line-height: 1;

  color: var(--md-accent, #2ea15d);
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

/* GRID */
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

body.dark .item-card-expiring {
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

/* CANTIDAD DE PRODUCTOS (card) */
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
  margin: 0;
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

/* LETRA (cuando no hay imagen) */
.item-letter {
  width: 60%;
  height: 80px;
  margin: 0 auto 8px;

  display: grid;
  place-items: center;

  border-radius: 10px;
  border: 1px solid var(--ion-border-color);

  font-family: "Risque", serif;
  font-weight: 400;
  line-height: 1;
  letter-spacing: 0;
  font-size: 62px;

  color: var(--md-accent, #2ea15d);
  background: color-mix(in srgb, var(--ion-background-color) 88%, var(--md-accent, #2ea15d) 12%);
}

body.dark .item-letter {
  border-color: #333333;
  background: color-mix(in srgb, var(--ion-background-color) 85%, var(--md-accent, #2ea15d) 15%);
}

/* ====== VISTA LISTADO (inventario) ====== */
.list-cards {
  display: grid;
  gap: 12px;
  margin-top: 8px;
}

.item-row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;

  /* ✅ un pelín menos de gap para ganar ancho */
  gap: 8px;

  padding: 10px 12px;

  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #eef2f4;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
}

body.dark .item-row {
  background: var(--ion-background-color);
  border-color: #333333;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.item-row-expiring {
  border: 2px solid #ef4444;
  box-shadow: 0 2px 12px rgba(239, 68, 68, 0.18);
}

body.dark .item-row-expiring {
  border: 2px solid #ef4444;
  box-shadow: 0 2px 12px rgba(239, 68, 68, 0.18);
}

.row-left {
  display: grid;
  grid-template-columns: 36px 1fr;

  align-items: center;
  gap: 8px;
  min-width: 0;
}

.item-row .icon {
  width: 36px;
  height: 36px;
  object-fit: contain;
  filter: drop-shadow(0 0 6px rgba(202, 202, 202, 0.37));
}

.item-row img.img-galery {
  width: 80%;
  margin: 0 8px;
  display: block;

  border-radius: 5%;
  object-fit: cover;
}

.icon-letter {
  width: 36px;
  height: 36px;

  display: grid;
  place-items: center;

  border-radius: 10px;
  border: 1px solid color-mix(in srgb, #ffffff 65%, var(--md-accent, #2ea15d) 35%);
  background: color-mix(in srgb, #ffffff 88%, var(--md-accent, #2ea15d) 12%);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);

  color: var(--md-accent, #2ea15d);

  font-family: "Risque", serif;
  font-weight: 400;
  font-size: 26px;
  line-height: 1;
}

.info {
  align-self: center;
  min-width: 0;
}

/* ✅ nombre en 2 líneas (más largo) */
.info .name {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--ion-text-color);

  white-space: normal;
  overflow: hidden;

  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.row-units {
  margin-top: 5px;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.units-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--ion-text-color2);

  min-width: auto; /* quita hueco */
  padding: 0 4px; /* solo un poco */
  text-align: left;
}

.qty-btn-row {
  --border-radius: 999px;
  --border-width: 1px;
  --border-style: solid;
  --border-color: #d1d5db;

  --background: var(--ion-background-color);

  width: 26px;
  height: 26px;
}

body.dark .qty-btn-row {
  --border-color: #9c9c9c;
}

.qty-btn-row::part(native) {
  width: 26px;
  height: 26px;
  border-radius: 999px;

  display: flex;
  align-items: center;
  justify-content: center;
}

.row-actions {
  display: flex;
  align-items: center;

  /* ✅ menos hueco */
  gap: 6px;
}

/* ✅ botones de acciones más pequeños */
.icon-action {
  width: 35px;
  height: 35px;

  --padding-start: 0;
  --padding-end: 0;
  --padding-top: 0;
  --padding-bottom: 0;

  border-radius: 9px;
}

.icon-action::part(native) {
  width: 35px;
  height: 35px;

  border-radius: 9px;

  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-action ion-icon {
  font-size: 16px;
}

.purchase-action {
  --color: #ffffff;
}

.move-action {
  --color: var(--md-accent, #2ea15d);
  border: 1px solid color-mix(in srgb, var(--md-accent, #2ea15d) 55%, transparent);
  background: color-mix(in srgb, var(--ion-background-color) 92%, var(--md-accent, #2ea15d) 8%);
}

.delete-action {
  --color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.35);
  background: color-mix(in srgb, var(--ion-background-color) 92%, #ef4444 8%);
}

/* BARRA ALFABÉTICA */
.alpha-bar {
  position: fixed;
  right: 8px;
  top: 50%;
  transform: translateY(-50%) translateX(10px);
  z-index: 20;

  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 4px;
  border-radius: 12px;

  user-select: none;
  -webkit-user-select: none;
  touch-action: none;

  opacity: 0;
  pointer-events: none;

  transition: opacity 180ms ease, transform 180ms ease;

  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.alpha-bar--visible {
  opacity: 1;
  transform: translateY(-50%) translateX(0);
  pointer-events: auto;
}

body.dark .alpha-bar {
  background: rgba(20, 20, 20, 0.68);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

/* ====== LETRAS ====== */
.alpha-letter {
  font-size: 12px;
  line-height: 12px;
  padding: 2px 4px;
  border-radius: 6px;
  text-align: center;
  min-width: 18px;

  font-weight: 600;

  color: var(--md-accent, #2ea15d);
}

body.dark .alpha-letter {
  color: var(--md-accent, #2ea15d);
}

.alpha-letter--active {
  font-weight: 700;
  background: rgba(0, 0, 0, 0.12);
}

body.dark .alpha-letter--active {
  background: rgba(255, 255, 255, 0.14);
}

@media (min-width: 820px) {
  ion-content.pantry-content {
    --padding-start: 14px;
    --padding-end: 14px;
  }

  .actions {
    max-width: 1020px;
    margin: 0 auto 8px;
  }

  .items-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 16px;
    max-width: 1020px;
    margin: 8px auto 0;
  }

  .item-card {
    padding: 14px;
    border-radius: 14px;
  }

  .list-cards {
    max-width: 1020px;
    margin: 8px auto 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .item-row {
    padding: 12px 14px;
    border-radius: 14px;
  }

  .row-left {
    grid-template-columns: 44px 1fr;
  }

  .icon,
  .icon-letter {
    width: 40px;
    height: 40px;
  }

  .icon-letter {
    font-size: 28px;
  }

  .info .name {
    font-size: 15px;
  }

  .units-value {
    font-size: 13px;
    min-width: 110px;
  }

  .alpha-bar {
    right: 10px;
  }

  .product-info-modal::part(content),
  .move-product-modal::part(content) {
    width: min(360px, 90%);
    max-height: 100%;
  }


/* PRODUCTOS FORMATO LISTA */
.row-units{
  margin-top: 5px;
  display: inline-flex;
  align-items: center;
  gap: 15px;
}

.units-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--ion-text-color2);
  min-width: 0;
  padding: 0 2px;
  margin: 0;
  line-height: 1;
  text-align: left;
}

.qty-btn-row {
  --border-radius: 999px;
  --border-width: 1px;
  --border-style: solid;
  --border-color: #d1d5db;

  --background: var(--ion-background-color);

  width: 24px;
  height: 24px;

  --padding-start: 0;
  --padding-end: 0;
  --padding-top: 0;
  --padding-bottom: 0;
}

body.dark .qty-btn-row {
  --border-color: #9c9c9c;
}

.qty-btn-row::part(native) {
  width: 24px;
  height: 24px;
  border-radius: 999px;

  display: flex;
  align-items: center;
  justify-content: center;

  line-height: 0;
}

.qty-btn-row .material-icons{
  font-size: 13px;
  line-height: 1;
  display: block;
}

}

/* FIX MODALES (editar + mover) */
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

.product-info-wrapper .info,
.product-info-wrapper .name,
.product-info-wrapper .units,
.product-info-wrapper .row-units,
.product-info-wrapper .units-value {
  all: unset;
  display: revert;
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
