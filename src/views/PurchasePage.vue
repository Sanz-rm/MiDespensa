<template>
  <ion-page>
    <InventoryAndPurcharseHeader :title="`Compra de ${props.name}`"
      :backHref="`/tabs/${props.code}/${props.name}/inventory`" />
    <ion-content class="ion-padding pantry-content">
      <!-- Acciones START-->
      <div class="actions">
        <ion-searchbar v-model="search" placeholder="Buscar producto…" :debounce="150" show-clear-button="focus" />
        <ion-button color="danger" expand="block" :disabled="loading || !hasItemsInPurchase"
          @click="showConfirmClear = true">
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
          <img class="icon" :src="getOptimizedUrl(item.imageUrl)" :alt="item.name" :class="{ 'img-galery': isImageGalery(item.imageUrl) }"/>
          <div class="info">
            <p class="name">{{ item.name }}</p>
            <p class="units">Stock: {{ item.quantity }} {{ getMeasurementUnit(item.unit, item.quantity) }}</p>
          </div>

          <!-- Icono para añadir nota cuando no hay nota -->
          <ion-button v-if="!item.notePurchase && editingNoteItemId !== item.id" class="note-icon" fill="clear"
            size="small" aria-label="Añadir nota" @click="openNoteInput(item)">
            <ion-icon :icon="readerOutline" />
          </ion-button>

          <ion-button class="trash" color="danger" fill="clear" size="small" aria-label="Quitar de la compra"
            @click="deleteItemToPurchase(item.id)">
            <ion-icon :icon="trashOutline" />
          </ion-button>

          <!-- Barra de nota -->
          <div v-if="item.notePurchase || editingNoteItemId === item.id" class="note-row">
            <textarea v-model="noteDraft[item.id]"
              :class="['note-textarea', { 'note-textarea--center': isSingleLineNote(item) }]"
              placeholder="Escribe una nota..." rows="1" :readonly="editingNoteItemId !== item.id"
              @click="editingNoteItemId !== item.id && enableNoteEdit(item)" @blur="handleBlurNote(item)"></textarea>


            <div class="note-actions">
              <button type="button" class="note note-cancel" @click="cancelNote(item)">
                <span class="material-icons">close</span>
              </button>
              <button v-if="hasNoteChanged(item)" type="button"
                :class="['note', 'note-ok', savedNoteItemId === item.id ? 'note-ok-saved' : '']"
                @click="saveNote(item)">
                <span class="material-icons">check</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-else-if="!loading" class="empty">
        <!-- Sin despensas Start -->
        <div class="empty-icon">
          <span class="material-icons">shopping_cart</span>
        </div>
        <p class="empty-title">No hay productos en la compra.</p>
        <p class="empty-subtitle">¡Añade los productos que te hagan falta!</p>
        <!-- Sin despensas end -->
      </div>

      <!-- Botón flotante START -->
      <ModalAddProduct :pantry-code="props.code" :items="items" view="purcharse" @willOpen="search = ''"/>
      <!-- Botón flotante END -->

      <!-- Pop up confirmar salir/eliminar despensa START -->
      <ConfirmPopup v-model="showConfirmClear" title="Vaciar compra"
        message="Se eliminarán todos los productos de la lista de compra. Esta acción no se puede deshacer. ¿Quieres continuar?"
        confirmLabel="Sí, vaciar" cancelLabel="Cancelar" @confirm="clearPurchase" />
      <!-- Pop up confirmar salir/eliminar despensa END -->

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonContent, IonSpinner, IonButton, IonIcon, IonSearchbar, toastController } from '@ionic/vue'
import { trashOutline, readerOutline } from 'ionicons/icons'
import type { Item } from '@/models/item'
import { onMounted, onBeforeUnmount, ref, computed } from 'vue'
import { collection, query, where, updateDoc, doc, getDoc, onSnapshot, type Unsubscribe, writeBatch, orderBy } from 'firebase/firestore'
import { getImageFirstLetter, getMeasurementUnit, getOptimizedUrl, isImageGalery } from '@/composables/itemUtils'
import { db } from '@/firebase'
import ConfirmPopup from '@/components/ui/ConfirmPopup.vue';
import ModalAddProduct from '@/components/layout/ModalAddProduct.vue'
import InventoryAndPurcharseHeader from '@/components/ui/InventoryAndPurcharseHeader.vue';

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

const hasItemsInPurchase = computed(() => items.value.some(it => it.inPurchase))

// control de nota en edición
const editingNoteItemId = ref<string | null>(null)
const noteDraft = ref<{ [key: string]: string }>({})
const savedNoteItemId = ref<string | null>(null)

// Lista de productos en compra con imagen y filtro por nombre
onMounted(() => {
  getPurchaseItems(props.code)
})

// Al cerrar la ventana dejaremos de escuchar a firestore
onBeforeUnmount(() => stop?.())

// Recuperamos los items de la despensa seleccionada (todos los items)
async function getPurchaseItems(pantryCode: string) {
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
          imageUrl: String(item.imageUrl ?? getImageFirstLetter(String(item.name ?? ''))),
          notePurchase: String(item.notePurchase ?? '')
        } as Item
      })

      // Sincronizar drafts con notas guardadas (para que el textarea muestre siempre la nota)
      const drafts: { [key: string]: string } = { ...noteDraft.value }
      for (const it of items.value) {
        if (it.notePurchase && !drafts[it.id]) {
          drafts[it.id] = it.notePurchase
        }
      }
      noteDraft.value = drafts

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

// abrir input para nueva nota
function openNoteInput(item: Item) {
  editingNoteItemId.value = item.id
  savedNoteItemId.value = null
  noteDraft.value[item.id] = item.notePurchase || ''
}

// devuelve true si el texto es corto (≈ 1 línea), false si ocupará más
function isSingleLineNote(item: Item): boolean {
  const text = (noteDraft.value[item.id] || '').trim() || 'Escribe una nota...'
  // umbral aproximado para una línea en móvil
  return text.length <= 35
}


// habilitar edición al pulsar sobre el textarea con nota ya guardada
function enableNoteEdit(item: Item) {
  editingNoteItemId.value = item.id
  savedNoteItemId.value = null
  noteDraft.value[item.id] = item.notePurchase || noteDraft.value[item.id] || ''
}

// comprobar si la nota ha cambiado respecto a base de datos
function hasNoteChanged(item: Item): boolean {
  const original = (item.notePurchase || '').trim()
  const current = (noteDraft.value[item.id] || '').trim()
  // no consideramos "cambio" si está vacío
  return !!current && original !== current
}

// manejar blur del textarea
async function handleBlurNote(item: Item) {
  if (editingNoteItemId.value !== item.id) return

  if (hasNoteChanged(item)) {
    await saveNote(item)
  } else {
    editingNoteItemId.value = null
    savedNoteItemId.value = null
  }
}

// guardar nota (crear/actualizar)
async function saveNote(item: Item) {
  try {
    const text = (noteDraft.value[item.id] || '').trim()
    if (!text) {
      await showErrorToast('La nota no puede estar vacía.')
      return
    }
    const refItem = doc(db, 'items', item.id)
    await updateDoc(refItem, { notePurchase: text })
    editingNoteItemId.value = null
    savedNoteItemId.value = item.id
  } catch (err) {
    console.error('Error al guardar la nota:', err)
    await showErrorToast('No se pudo guardar la nota.')
  }
}


// cancelar / borrar nota
async function cancelNote(item: Item) {
  try {
    // si ya tenía nota, la borramos
    if (item.notePurchase) {
      const refItem = doc(db, 'items', item.id)
      await updateDoc(refItem, { notePurchase: null })
    }
    editingNoteItemId.value = null
    savedNoteItemId.value = null
    noteDraft.value[item.id] = ''
  } catch (err) {
    console.error('Error al borrar la nota:', err)
    await showErrorToast('No se pudo borrar la nota.')
  }
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
    await updateDoc(ref, {
      inPurchase: false,
      notePurchase: null
    })
  } catch (err) {
    console.error('Error al quitar de la compra:', err)
    await showErrorToast('No se pudo quitar el producto de la compra.')
  }
}

// Vaciar compra (poner inPurchase=false a todos los productos de la compra)
async function clearPurchase() {
  try {
    const toClear = items.value.filter(it => it.inPurchase)
    if (!toClear.length) return
    const batch = writeBatch(db)
    for (const it of toClear) {
      batch.update(doc(db, 'items', it.id), { inPurchase: false })
    }
    await batch.commit()
  } catch (err) {
    console.error('Error al vaciar la compra:', err)
    await showErrorToast('No se pudo vaciar la compra.')
  }
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
.actions {
  display: grid;
  gap: 12px;
  margin-bottom: 8px;
}

/* BUSCADOR */
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

/* LISTA DE COMPRA */
.list-cards {
  display: grid;
  gap: 12px;
}

.item-row {
  display: grid;
  grid-template-columns: 40px 1fr auto auto;
  align-items: flex-start;
  gap: 8px 12px;

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

/* IMAGEN */
.icon {
  width: 36px;
  height: 36px;
  object-fit: contain;
  filter: drop-shadow(0 0 6px rgba(202, 202, 202, 0.37));
}

/* IMAGEN GALERÍA */
.item-row img.img-galery {
  width: 80%;
  margin: 0 8px;
  display: block;

  border-radius: 5%;
  object-fit: cover;
}

/* INFORMACION PRODUCTO COMPRA */
.info {
  align-self: center;
}

.info .name {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--ion-text-color);
}

.info .units {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--ion-text-color2);
}

/* ICONOS DE NOTA Y BORRAR DE COMPRA */
.note-icon,
.trash {
  --padding-start: 6px;
  --padding-end: 6px;
}

.note-icon {
  color: var(--ion-text-color2);
}

.note-row {
  grid-column: 1 / -1;

  display: flex;
  align-items: center;
  justify-content: space-between;

  margin-top: 1%;
  padding: 0 8px;

  background: #f3f4f6;
  border: 1px solid #cacaca;
  border-radius: 8px;

  font-size: 14px;
}

body.dark .note-row {
  background: #2d2e2e;
  border-color: rgba(85, 85, 85, 0.8);
}

.note-textarea {
  flex: 1;
  box-sizing: border-box;

  border: none;
  outline: none;
  background: transparent;

  font-size: 14px;
  line-height: 1.4;
  white-space: pre-wrap;

  min-height: 44px;
  max-height: 80px;
  resize: none;
}

.note-textarea--center {
  padding-top: 4%;
}

.note-actions {
  display: flex;
  gap: 8px;
  margin-left: 8px;
}

/* BOTON NOTA */
.note {
  width: 22px;
  height: 22px;

  display: flex;
  align-items: center;
  justify-content: center;

  border: none;
  border-radius: 5px;

  font-size: 11px;
  cursor: pointer;
}

/* BORRAR NOTA */
.note-cancel {
  background: #ef4444;
  color: #ffffff;
}

/* GUARDAR NOTA */
.note-ok {
  background: #16a34a;
  color: #ffffff;
}

/* NOTA GUARDADA */
.note-ok-saved {
  background: rgba(85, 141, 106, 0.87);
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

/* LOADING */
.loading-box {
  display: grid;
  place-content: center;
  min-height: 40vh;
}
</style>
