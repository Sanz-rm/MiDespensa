<!-- components/layout/ModalAddProduct.vue -->
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
                        autofocus
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
                <h3 class="suggested-title">Añade productos a tu despensa</h3>

                <!-- INVENTARIO: solo comunes que no tenemos (se mantiene igual) -->
                <template v-if="view === 'inventory'">
                    <!-- Render de los items comunes -->
                    <div v-if="comunItemsFiltered && comunItemsFiltered.length">
                        <div class="suggested-grid">
                            <div v-for="item in comunItemsFiltered" :key="item.id" class="suggested-card">
                                <img :src="getOptimizedUrl(item.imageUrl)" :alt="item.name" class="suggested-img" />
                                <p class="suggested-name">{{ item.name }}</p>

                                <!-- Botón para añadir al inventario -->
                                <ion-button size="small" class="btn-add"
                                    @click="addItemFromPantry(item.name, item.imageUrl)">
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
                        >
                            <img
                                :src="getOptimizedUrl(item.imageUrl)"
                                :alt="item.name"
                                class="suggested-img"
                                :class="{ 'img-galery': isImageGalery(item.imageUrl) }"
                            />
                            <p class="suggested-name">{{ item.name }}</p>

                            <!-- Botón según tipo -->
                            <ion-button
                                size="small"
                                class="btn-add"
                                @click="
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
    IonIcon
} from '@ionic/vue'
import { addOutline } from 'ionicons/icons'
import { ref, computed, watch } from 'vue'
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
} from 'firebase/firestore'
import { db } from '@/firebase'
import { showToast } from '@/composables/showToast'
import { getImageFirstLetter, getOptimizedUrl, isImageGalery } from '@/composables/itemUtils'
import type { Item } from '@/models/item'
import type { ComunItem } from '@/models/comunItem'

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

const norm = (s: string) =>
    s
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .trim()

const comunItemsFiltered = computed(() => {
    const q = norm(newProductName.value)
    if (!q) return comunItems.value
    return comunItems.value.filter(it => norm(it.name).includes(q))
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
        imageUrl: c.imageUrl,
    }))
    const inv = inventoryNotInPurchaseFiltered.value.map(i => ({
        kind: 'inventory' as const,
        id: i.id,
        name: i.name,
        imageUrl: i.imageUrl,
    }))

    let merged = [...commons, ...inv]

    if (filterMode.value === 'inventory') {
        merged = merged.filter(i => i.kind === 'inventory')
    }

    merged.sort((a, b) =>
        a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
    )

    return merged
})

const modalTitle = computed(() =>
    props.view === 'purcharse' ? 'Crear producto en compra' : 'Crear producto'
)

const fabAriaLabel = computed(() =>
    props.view === 'purcharse' ? 'Crear producto en compra' : 'Crear producto'
)

const defaultInPurchase = computed<boolean>(() => props.view === 'purcharse')

// Modal crear producto
function openCreateModal() {
    filterMode.value = 'all'
    getComunItems()
    isCreateOpen.value = true
}

function closeCreateModal() {
    isCreateOpen.value = false
    newProductName.value = ''
}

// Confirmamos creación desde el modal
async function confirmCreate() {
    await addItemFromPantry(newProductName.value, getImageFirstLetter(newProductName.value))
    if (newProductName.value.trim()) {
        newProductName.value = ''
    }
}

function clearInput() {
    newProductName.value = ''
}

// Obtenemos todas los items comunes que aun no tenemos
async function getComunItems() {
    try {
        loading.value = true
        const q = query(collection(db, 'comun_items'), orderBy('name', 'asc'))
        const snap = await getDocs(q)

        const existing = new Set(
            (props.items ?? []).map((i: Item) => {
                const n = String(i?.name ?? '').trim().toLowerCase()
                const img = String(i?.imageUrl ?? '')
                return `${n}__${img}`
            })
        )

        comunItems.value = snap.docs
            .map(d => {
                const data = d.data() as any
                return {
                    id: String(d.id),
                    name: String(data?.name ?? ''),
                    imageUrl: String(data?.imageUrl ?? ''),
                } as ComunItem
            })
            .filter(ci => {
                const n = ci.name.trim().toLowerCase()
                const img = String(ci.imageUrl ?? '')
                const key = `${n}__${img}`
                return !existing.has(key)
            })
    } catch (err) {
        console.error('Error al obtener productos comunes:', err)
        await showToast('Error al cargar los productos sugeridos.', 'danger')
    } finally {
        loading.value = false
    }
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
      quantity: 1,
      unit: 'Unidad',
      inPurchase: defaultInPurchase.value,
      imageUrl: imageUrl,
    })

    const pantryRef = await getPantryRefByCode()
    batch.update(pantryRef, { totalItems: increment(1) })

    await batch.commit()

    await showToast(`Producto ${name} añadido.`, 'success')
  } catch (err) {
    console.error('Error al añadir producto:', err)
    await showToast(`No se pudo añadir el producto ${name}.`, 'danger')
  } finally {
    loading.value = false
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
    }
}

// Obtenemos el identificador del documento de la despensa actual
async function getPantryRefByCode() {
    if (pantryDocId.value) return doc(db, 'pantries', pantryDocId.value)

    const q = query(
        collection(db, 'pantries'),
        where('code', '==', props.pantryCode),
        limit(1)
    )
    const snap = await getDocs(q)
    if (snap.empty) throw new Error(`No existe la despensa con code ${props.pantryCode}`)

    pantryDocId.value = snap.docs[0].id
    return snap.docs[0].ref
}

// Al abrir/cerrar el modal, refrescamos sugerencias
watch(isCreateOpen, open => {
    if (open) {
        getComunItems()
    }
})

// Cada vez que cambien los items del padre, si el modal está abierto refrescamos sugerencias
watch(
    () => props.items,
    () => {
        if (isCreateOpen.value) {
            getComunItems()
        }
    },
    { deep: true }
)
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
  border-radius: 10px;

  --background: var(--ion-background-color2);
  --padding-start: 12px;
  --padding-end: 12px;
  --padding-top: 10px;
  --padding-bottom: 10px;

  border: 1px solid var(--ion-border-color);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
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
</style>
