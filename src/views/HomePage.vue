<template>
  <ion-page>
    <!-- Cabecera reutilizable start -->
    <ion-header class="rounded-header">
      <PantryHeader title="MI DESPENSA" />
    </ion-header>
    <!-- Cabecera reutilizable end -->

    <ion-content class="ion-padding pantry-content">
      <!-- Mensaje de error start -->
      <div v-if="pantryError" class="error-box">
        <span>{{ pantryError }}</span>
      </div>
      <!-- Mensaje de error end -->

      <!-- Acciones start -->
      <div class="actions">
        <button class="btn btn-solid" @click="openCreate()">
          <span class="material-icons" expand="block">add</span>
          Nueva Despensa
        </button>
        <button class="btn btn-outline" @click="openJoin()">
          <span class="material-icons" expand="block">group</span>
          Unirse a Despensa
        </button>
      </div>
      <!-- Acciones end -->

      <!-- Loading start -->
      <div v-if="loading" class="loading-box">
        <ion-spinner name="crescent" style="transform: scale(2)"></ion-spinner>
      </div>
      <!-- Loading end -->

      <!-- Lista de despensas start -->
      <div v-else>
        <!-- Sin despensas Start -->
        <div v-if="!pantries.length" class="empty-state">
          <div class="empty-icon">
            <span class="material-icons">home</span>
          </div>
          <p class="empty-title">No tienes despensas aún</p>
          <p class="empty-subtitle">Crea tu primera despensa o únete a una existente</p>
        </div>
        <!-- Sin despensas end -->

        <!-- Lista de tarjetas start-->
        <div v-else class="pantry-list">
          <div
            v-for="(pantry, i) in pantries"
            :key="i"
            class="pantry-card"
            @click="onCardClick($event, pantry)"
          >
            <!-- Botón salir/eliminar start -->
            <button
              type="button"
              class="corner-btn"
              :class="pantry.creatorId === deviceId ? 'danger' : 'accent'"
              @click.stop="onCornerAction(pantry)"
            >
              <span
                class="material-icons icons-red"
                v-if="pantry.creatorId === deviceId"
                title="Eliminar despensa"
                aria-label="Eliminar despensa"
                >delete</span
              >
              <span
                class="material-icons icons-red"
                v-else
                title="Salir de despensa"
                aria-label="Salir de despensa"
                >logout</span
              >
            </button>
            <!-- Botón salir/eliminar end -->

            <!-- ✅ NUEVO: botón renombrar (solo creador) -->
            <button
              type="button"
              class="corner-btn rename"
              @click.stop="openRename(pantry)"
              title="Cambiar nombre"
              aria-label="Cambiar nombre"
            >
              <span class="material-icons">edit</span>
            </button>
            <!-- ✅ NUEVO: botón renombrar end -->

            <!-- Icono despensa start -->
            <div class="icon-box">
              <div class="icon-house">
                <span class="material-icons">home</span>
              </div>
            </div>
            <!-- Icono despensa end -->

            <!-- Info despensa start -->
            <div class="info">
              <div class="title-row">
                <h3 class="name">{{ pantry.name }}</h3>
              </div>
              <div class="meta">
                <div class="meta-item">
                  <span class="meta-icon material-icons" aria-hidden="true">group</span>
                  <span>
                    {{ pantry.memberCount ?? 0 }}
                    {{ (pantry.memberCount ?? 0) === 1 ? 'miembro' : 'miembros' }}
                  </span>
                </div>
                <div class="meta-sep">•</div>
                <div class="meta-item">
                  <span class="meta-icon material-icons" aria-hidden="true">inventory_2</span>
                  <span>
                    {{ pantry.totalItems ?? 0 }}
                    {{ (pantry.totalItems ?? 0) === 1 ? 'producto' : 'productos' }}
                  </span>
                </div>
              </div>
              <div class="footer-row">
                <!-- Botón copiar código start -->
                <button
                  type="button"
                  class="code-chip copy-btn"
                  @click.stop="copyPantryCode(pantry.code)"
                  :aria-label="`Copiar código ${pantry.code}`"
                  title="Copiar código"
                >
                  <span class="chip-text">{{ pantry.code }}</span>
                  <span class="chip-copy material-icons" aria-hidden="true">content_copy</span>
                </button>
                <!-- Botón copiar código end -->
              </div>
            </div>
            <!-- Info despensa end -->
          </div>
        </div>
      </div>
      <!-- Lista de despensas end -->

      <!-- ✅ Popup renombrar (mismo diseño ConfirmPopup) START -->
      <div v-if="showRenamePopup" class="confirm-overlay" @click.self="closeRename">
        <div class="confirm-dialog">
          <h2>Renombrar despensa</h2>

          <p class="confirm-message">Cambia el nombre de “{{ renamePantry?.name }}”</p>

          <input
            v-model="renameValue"
            class="confirm-input"
            type="text"
            maxlength="25"
            placeholder="Nuevo nombre"
            aria-label="Nuevo nombre"
            @keydown.enter.prevent="confirmRename"
          />

          <div class="confirm-actions">
            <button type="button" class="btn-secondary" @click="closeRename">Cancelar</button>
            <button type="button" class="btn-primary" @click="confirmRename">Guardar</button>
          </div>
        </div>
      </div>
      <!-- ✅ Popup renombrar END -->

      <!-- Pop up confirmar salir/eliminar despensa START -->
      <ConfirmPopup
        v-if="selectedPantry"
        v-model="showConfirmPantry"
        :title="selectedPantry.creatorId === deviceId ? 'Eliminar despensa' : 'Salir de la despensa'"
        :message="
          selectedPantry.creatorId === deviceId
            ? `Vas a eliminar definitivamente “${selectedPantry.name}”. Esta acción no se puede deshacer. ¿Quieres eliminarla?`
            : `Vas a salir de “${selectedPantry.name}”. Podrás volver con su código. ¿Quieres salir?`
        "
        :confirmLabel="selectedPantry.creatorId === deviceId ? 'Eliminar' : 'Salir'"
        cancelLabel="Cancelar"
        @confirm="confirmPantry"
      />
      <!-- Pop up confirmar salir/eliminar despensa END -->
    </ion-content>

    <!-- Modal reutilizable en modo CREAR start -->
    <PantryModal
      v-model="openCreateModal"
      mode="create"
      @confirm="handleCreate"
      @close="openCreateModal = false"
    />
    <!-- Modal reutilizable en modo CREAR end -->

    <!-- Modal reutilizable en modo UNIRSE start -->
    <PantryModal
      v-model="openJoinModal"
      mode="join"
      @confirm="handleJoin"
      @close="openJoinModal = false"
    />
    <!-- Modal reutilizable en modo UNIRSE end -->
  </ion-page>
</template>

<script setup lang="ts">
import PantryHeader from '@/components/ui/PantryHeader.vue'
import { IonPage, IonHeader, IonContent, IonSpinner, onIonViewWillEnter } from '@ionic/vue'
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  onSnapshot,
  type Unsubscribe,
  increment,
  orderBy,
  doc,
  writeBatch
} from 'firebase/firestore'
import { db } from '@/firebase'
import { Pantry } from '@/models/pantry'
import { useRouter } from 'vue-router'
import { showToast } from '@/composables/showToast'
import PantryModal from '@/components/ui/PantryModal.vue'
import ConfirmPopup from '@/components/ui/ConfirmPopup.vue'
import { generatePantryCode } from '@/composables/pantryUtils'

// Estado de apertura modal de cada modo
const openCreateModal = ref(false)
const openJoinModal = ref(false)

// Estados popup confirmación eliminar/salir despensa
const showConfirmPantry = ref<boolean>(false)
const selectedPantry = ref<Pantry | null>(null)

// ✅ NUEVO: estados popup renombrar
const showRenamePopup = ref(false)
const renamePantry = ref<Pantry | null>(null)
const renameValue = ref('')

// Utility: blur focused element (avoid aria-hidden / autofocus conflicts when opening modals)
function blurActiveElement() {
  try {
    const el = document.activeElement as HTMLElement | null
    if (el && typeof el.blur === 'function') el.blur()
  } catch (e) {
    console.log('[blurActiveElement] noop catch', e)
  }
}

function openCreate() {
  blurActiveElement()
  openCreateModal.value = true
}
function openJoin() {
  blurActiveElement()
  openJoinModal.value = true
}

const pantries = ref<Pantry[]>([])
const error = ref<string | null>(null)
const pantryError = ref<string | null>(null)
const loading = ref<boolean>(false)

// Hacemos reactivo el listado de códigos para poder re-suscribir el snapshot cuando cambie
const codes = ref<string[]>(JSON.parse(localStorage.getItem('myPantries') ?? '[]'))
const pantryName = ref<string>('')
let stop: Unsubscribe | null = null

const deviceId = getDeviceId()
const router = useRouter()

// Normaliza y deduplica códigos
function normalizeCodes(input: any): string[] {
  const arr = Array.isArray(input) ? input : []
  const normalized = arr.map((c) => String(c ?? '').trim().toUpperCase()).filter(Boolean)
  return Array.from(new Set(normalized))
}

// Lee storage y sincroniza el ref codes (esto dispara el watch y resubscribe)
function syncCodesFromStorage() {
  try {
    const raw = localStorage.getItem('myPantries')
    const parsed = JSON.parse(raw ?? '[]')
    const normalized = normalizeCodes(parsed)

    const current = normalizeCodes(codes.value)
    const sameLength = current.length === normalized.length
    const sameContent = sameLength && current.every((v, i) => v === normalized[i])

    if (!sameContent) {
      console.log('[syncCodesFromStorage] codes updated from storage', normalized)
      codes.value = normalized
    } else {
      console.log('[syncCodesFromStorage] codes already in sync', normalized)
    }
  } catch (e) {
    console.log('[syncCodesFromStorage] error parsing myPantries', e)
  }
}

const onMyPantriesChanged = () => {
  syncCodesFromStorage()
}

onMounted(() => {
  window.addEventListener('myPantriesChanged', onMyPantriesChanged as any)
  syncCodesFromStorage()
  getUserPantries()
})

onIonViewWillEnter(() => {
  syncCodesFromStorage()
})

onBeforeUnmount(() => {
  try {
    stop?.()
  } catch (e) {
    console.log('[onBeforeUnmount] error stopping listener', e)
  }

  try {
    window.removeEventListener('myPantriesChanged', onMyPantriesChanged as any)
  } catch (e) {
    console.log('[onBeforeUnmount] error removing myPantriesChanged listener', e)
  }
})

watch(
  codes,
  (newCodes) => {
    console.log('[codes] changed -> resubscribe', newCodes)
    resubscribe(newCodes)
  },
  { deep: true }
)

// Obtenemos el Identificador de nuestro dispositivo
function getDeviceId(): string {
  let id = localStorage.getItem('deviceId')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('deviceId', id)
  }
  console.log('Disposito actual:', id)
  return id
}

function resubscribe(codesList: string[]) {
  try {
    stop?.()
  } catch (e) {
    console.log('[resubscribe] error stopping previous listener', e)
  }

  const safeCodes = normalizeCodes(codesList)

  if (!safeCodes || safeCodes.length === 0) {
    console.log('[resubscribe] no codes -> clear list')
    pantries.value = []
    loading.value = false
    return
  }

  const q = query(collection(db, 'pantries'), where('code', 'in', safeCodes), orderBy('name', 'asc'))
  stop = onSnapshot(
    q,
    (snap) => {
      pantries.value = snap.docs.map((d) => {
        const pantryData = d.data() as any
        return {
          id: String(d.id),
          code: String(pantryData.code ?? ''),
          name: String(pantryData.name ?? ''),
          memberCount: Number(pantryData.memberCount ?? 1),
          totalItems: Number(pantryData.totalItems ?? 0),
          creatorId: String(pantryData.creatorId ?? '0000')
        } as Pantry
      })

      for (const code of [...safeCodes]) {
        if (!pantries.value.some((p) => p.code === code)) {
          deletePantryFromStorage(code)
        }
      }

      console.log('Despensas actuales (snapshot):', pantries.value)
      loading.value = false
    },
    (err) => {
      console.log('[onSnapshot] error', err)
      error.value = err?.message ?? String(err)
      loading.value = false
    }
  )
}

async function getUserPantries() {
  console.log('Mis despensas (storage):', codes.value)
  loading.value = true
  resubscribe(codes.value)
}

async function handleCreate(payload: { name: string } | { code: string }) {
  try {
    if ('name' in payload) {
      pantryName.value = payload.name.trim()
      await createPantry()
      openCreateModal.value = false
    }
  } catch (e: any) {
    console.log('[handleCreate] error', e)
    pantryError.value = e?.message ?? 'Error al crear la despensa.'
  }
}
async function handleJoin(payload: { name: string } | { code: string }) {
  try {
    if ('code' in payload) {
      await joinPantry(payload.code)
      openJoinModal.value = false
    }
  } catch (e: any) {
    console.log('[handleJoin] error', e)
    pantryError.value = e?.message ?? 'Error al unirse a la despensa.'
  }
}

async function createPantry() {
  pantryError.value = null

  let name = pantryName.value?.trim() ?? ''
  if (name === '') {
    showToast('El nombre de la despensa es obligatorio.', 'danger')
    return
  }
  if (name.length > 25) {
    showToast('El nombre de la despensa es muy largo.', 'danger')
    return
  }

  name = name.charAt(0).toUpperCase() + name.slice(1)

  try {
    const code = await generatePantryCode()

    const docRef = await addDoc(collection(db, 'pantries'), {
      name,
      code,
      memberCount: 1,
      totalItems: 0,
      creatorId: deviceId
    })

    console.log('Despensa creada en Firestore:', { id: docRef.id, name, code })

    addPantryToStorage(code)
    pantryError.value = null
  } catch (e: any) {
    console.log('[createPantry] error', e)
    pantryError.value = e?.message ?? 'Error al crear la despensa.'
  }
}

async function joinPantry(joinCode: string) {
  const code = joinCode?.trim().toUpperCase()
  if (!code) {
    showToast('Introduce un código válido.', 'danger')
    return
  }

  const q = query(collection(db, 'pantries'), where('code', '==', code))
  const snap = await getDocs(q)
  if (snap.empty) {
    showToast('Despensa no encontrada.', 'danger')
    return
  }

  const pantryRef = snap.docs[0].ref

  if (pantries.value.some((p) => p.id === pantryRef.id)) {
    showToast('Ya estás unido a esta despensa.', 'danger')
    return
  }

  addPantryToStorage(code)

  console.log('Despensa agregada a storage:', { code, pantryId: pantryRef.id })

  try {
    await updateDoc(pantryRef, { memberCount: increment(1) })
  } catch (e) {
    console.log('[joinPantry] error actualizando memberCount', e)
  }
}

async function deleteOrLeavePantry(joinCode: string) {
  pantryError.value = null

  const code = joinCode?.trim().toUpperCase()
  const q = query(collection(db, 'pantries'), where('code', '==', code))
  const snap = await getDocs(q)

  if (snap.empty) {
    await showToast(`Despensa no encontrada.`, 'danger')
    return
  }
  const pantryRef = snap.docs[0].ref
  const pantry = snap.docs[0].data() as any

  if (pantry.creatorId === deviceId) {
    await deletePantryAndItems(pantryRef.id, code)
  } else {
    await updateDoc(pantryRef, { memberCount: increment(-1) })
  }

  deletePantryFromStorage(code)
}

async function deletePantryAndItems(pantryRef: string, pantryCode: string) {
  const pantryDocRef = doc(db, 'pantries', pantryRef)

  const itemsColRef = collection(db, 'items')
  const itemsQ = query(itemsColRef, where('pantryCode', '==', pantryCode))
  const itemsSnap = await getDocs(itemsQ)

  const toDelete = itemsSnap.docs.map((d) => d.ref)
  const chunkSize = 400
  for (let i = 0; i < toDelete.length; i += chunkSize) {
    const batch = writeBatch(db)
    toDelete.slice(i, i + chunkSize).forEach((ref) => batch.delete(ref))
    if (i + chunkSize >= toDelete.length) {
      batch.delete(pantryDocRef)
    }
    await batch.commit()
  }

  if (toDelete.length === 0) {
    const batch = writeBatch(db)
    batch.delete(pantryDocRef)
    await batch.commit()
  }
}

function addPantryToStorage(code: string) {
  const existing: string[] = JSON.parse(localStorage.getItem('myPantries') ?? '[]')
  if (!existing.includes(code)) {
    existing.push(code)
    localStorage.setItem('myPantries', JSON.stringify(existing))
    codes.value = normalizeCodes(existing)
  } else {
    console.log('[addPantryToStorage] ya existía', code)
  }
}

function deletePantryFromStorage(code: string) {
  const existing: string[] = JSON.parse(localStorage.getItem('myPantries') ?? '[]')
  const updated = existing.filter(
    (c) => String(c ?? '').trim().toUpperCase() !== String(code ?? '').trim().toUpperCase()
  )
  localStorage.setItem('myPantries', JSON.stringify(updated))
  codes.value = normalizeCodes(updated)
  console.log('[deletePantryFromStorage] actualizado storage', updated)
}

function onCornerAction(pantry: Pantry) {
  selectedPantry.value = pantry
  showConfirmPantry.value = true
}

async function confirmPantry() {
  if (!selectedPantry.value) return
  const pantry = selectedPantry.value
  const isOwner = pantry.creatorId === deviceId

  try {
    await deleteOrLeavePantry(pantry.code)
    await showToast(isOwner ? 'Despensa eliminada' : 'Has salido de la despensa', 'success')
  } catch (e: any) {
    console.log('[confirmPantry] error', e)
    await showToast(isOwner ? 'Error al eliminar despensa.' : 'Error al abandonar despensa.', 'danger')
  } finally {
    selectedPantry.value = null
  }
}

function selectPantry(code: string, name: string) {
  router.push(`/tabs/${code}/${name}/inventory`)
}

function onCardClick(e: MouseEvent, pantry: Pantry) {
  const target = e.target as HTMLElement
  if (target.closest('.corner-btn')) return
  selectPantry(pantry.code, pantry.name)
}

// ✅ NUEVO: renombrar
function normalizePantryName(name: string) {
  let n = String(name ?? '').trim().replace(/\s+/g, ' ')
  if (!n) return ''
  n = n.charAt(0).toUpperCase() + n.slice(1)
  return n
}

function openRename(p: Pantry) {
  blurActiveElement()
  renamePantry.value = p
  renameValue.value = String(p.name ?? '').trim()
  showRenamePopup.value = true
}

function closeRename() {
  showRenamePopup.value = false
  renamePantry.value = null
  renameValue.value = ''
}

async function confirmRename() {
  try {
    const p = renamePantry.value
    if (!p) return

    const newName = normalizePantryName(renameValue.value)
    if (!newName) {
      await showToast('El nombre es obligatorio', 'danger')
      return
    }
    if (newName.length > 25) {
      await showToast('El nombre de la despensa es muy largo', 'danger')
      return
    }
    if (newName === String(p.name ?? '').trim()) {
      closeRename()
      return
    }

    await updateDoc(doc(db, 'pantries', p.id), { name: newName })
    await showToast('Nombre actualizado', 'success')
    closeRename()
  } catch (e) {
    console.log('[confirmRename] error', e)
    await showToast('No se pudo cambiar el nombre', 'danger')
  }
}

async function copyPantryCode(code: string) {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(code)
    } else {
      const ta = document.createElement('textarea')
      ta.value = code
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    try {
      navigator.vibrate?.(15)
    } catch (e) {
      console.log('[copyPantryCode] vibrate noop', e)
    }
    await showToast(`Código copiado: ${code}`, 'success')
  } catch (e) {
    console.log('[copyPantryCode] error', e)
    await showToast('No se pudo copiar el código', 'danger')
  }
}
</script>

<style scoped>
/* FONDO */
ion-content.pantry-content {
  --md-page-bg: var(--ion-background-color, #ffffff);

  --md-card-bg: #ffffff;
  --md-card-border: var(--md-accent, #2ea15d);
  --md-card-shadow: 0 2px 0 rgba(var(--md-accent-rgb, 46, 161, 93), 0.12);

  --md-text: #111827;
  --md-muted: #6b7280;

  --background: var(--md-page-bg);

  display: flex;
  flex-direction: column;
  gap: 16px;
}

body.dark ion-content.pantry-content {
  --md-card-bg: var(--md-page-bg);
  --md-card-border: rgba(var(--md-accent-rgb, 46, 161, 93), 0.55);
  --md-card-shadow: 0 12px 28px rgba(0, 0, 0, 0.45);

  --md-text: rgba(255, 255, 255, 0.92);
  --md-muted: rgba(229, 231, 235, 0.78);
}

/* HEADER */
ion-header.rounded-header {
  --background: transparent;
  --ion-background-color: transparent;
  --box-shadow: none;

  border: 0;
  padding: 0;
  overflow: visible;

  background: transparent !important;
  box-shadow: none !important;
}

ion-header.rounded-header::after {
  display: none;
}

/* ERRORES */
.error-box {
  margin-bottom: 6px;
  text-align: center;
}

.error-box span {
  color: #e53935;
  font-weight: 700;
}

/* ACCIONES / BOTONES */
.actions {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.btn {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  padding: 10px 14px;
  border-radius: 999px;

  font-size: 14px;
  font-weight: 700;

  border: 2px solid var(--md-accent, #2ea15d);
  background: transparent;
  color: var(--md-accent, #2ea15d);

  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.04);
  transition: transform 120ms ease, box-shadow 120ms ease, background-color 120ms ease;
}

body.dark .btn {
  box-shadow: none;
}

.btn-solid {
  background: var(--md-accent, #2ea15d);
  color: #ffffff;
}

.btn-outline:hover,
.btn-solid:hover {
  transform: translateY(-1px);
}

body.dark .btn-outline {
  background: rgba(var(--md-accent-rgb, 46, 161, 93), 0.08);
}

.btn-outline:last-child {
  margin-bottom: 5%;
}

/* LOADING */
.loading-box {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* TARJETAS/LISTA DE DESPENSAS */
.pantry-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.pantry-card {
  position: relative;
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 12px;

  padding: 12px;
  border-radius: 14px;

  background: var(--md-card-bg);
  border: 2px solid var(--md-card-border);
  box-shadow: var(--md-card-shadow);

  cursor: pointer;
  transition: transform 120ms ease, box-shadow 120ms ease;
}

.pantry-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
}

body.dark .pantry-card {
  background: rgba(var(--md-accent-rgb, 46, 161, 93), 0.08);
}

/* BOTON ELIMINAR/SALIR DESPENSA */
.corner-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;

  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 8px;

  display: grid;
  place-items: center;

  background: #ffffff;
  box-shadow: inset 0 0 0 2px #e8eef2;

  pointer-events: auto;
}

body.dark .corner-btn,
body.dark .corner-btn.accent,
body.dark .corner-btn.danger {
  background: rgba(var(--md-accent-rgb, 46, 161, 93), 0.08);
}

.corner-btn.danger {
  color: #e53935;
  box-shadow: inset 0 0 0 2px #e53935;
}

.corner-btn.accent {
  color: var(--md-accent, #2ea15d);
  box-shadow: inset 0 0 0 2px #e53935;
}

.corner-btn.rename {
  right: 48px;
  color: var(--md-accent, #2ea15d);
  box-shadow: inset 0 0 0 2px rgba(var(--md-accent-rgb, 46, 161, 93), 0.45);
}

/* ICONO TARJETA DESPENSA */
.icon-box {
  display: grid;
  place-items: center;
}

.icon-house {
  width: 44px;
  height: 44px;
  border-radius: 10px;

  display: grid;
  place-items: center;

  background: rgba(var(--md-accent-rgb, 46, 161, 93), 0.12);
  border: 2px solid rgba(var(--md-accent-rgb, 46, 161, 93), 0.28);
}

body.dark .icon-house {
  background: rgba(var(--md-accent-rgb, 46, 161, 93), 0.16);
  border-color: rgba(var(--md-accent-rgb, 46, 161, 93), 0.38);
}

/* CONTENIDO TARJETA DESPENSA */
.info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.name {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: var(--md-accent, #2ea15d);
}

.meta {
  display: flex;
  align-items: center;
  gap: 8px;

  font-size: 13px;
  color: var(--md-muted);
}

body.dark .meta {
  color: var(--md-muted);
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.meta-icon {
  font-size: 14px;
}

.meta-sep {
  opacity: 0.6;
}

.footer-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 2px;
}

/* CODIGO DE DESPENSA */
.copy-btn {
  cursor: pointer;
  border: none;
  background: none;
  padding: 0;
}

.code-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;

  padding: 6px 10px;
  border-radius: 10px;

  font-size: 13px;
  font-weight: 700;

  color: var(--md-text);
  background: rgba(var(--md-accent-rgb, 46, 161, 93), 0.1);
  border: 2px solid rgba(var(--md-accent-rgb, 46, 161, 93), 0.18);
}

body.dark .code-chip {
  color: var(--md-text);
  background: rgba(var(--md-accent-rgb, 46, 161, 93), 0.14);
  border-color: rgba(var(--md-accent-rgb, 46, 161, 93), 0.32);
}

.copy-btn:focus-visible {
  outline: 2px solid var(--md-accent, #2ea15d);
  outline-offset: 2px;
  border-radius: 12px;
}

.chip-text {
  letter-spacing: 0.5px;
}

.chip-copy {
  opacity: 0.8;
}

/* SIN RESULTADOS */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  padding: 24px 16px;
  text-align: center;

  color: #6b7280;
}

body.dark .empty-state {
  color: rgba(229, 231, 235, 0.75);
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

body.dark .empty-subtitle {
  color: rgba(229, 231, 235, 0.72);
}

/* ICONOS */
.icons-red {
  color: #e94031;
}

/* POPUP */
.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;

  display: flex;
  align-items: center;
  justify-content: center;

  background: rgba(15, 23, 42, 0.45);
}

.confirm-dialog {
  width: min(360px, 90%);
  padding: 18px 20px 16px;

  background: var(--ion-background-color2);
  border-radius: 18px;

  box-shadow: 0 15px 40px rgba(15, 23, 42, 0.25);
  animation: popup-in 180ms ease-out;

  border: 1px solid rgba(var(--md-accent-rgb, 46, 161, 93), 0.18);
}

.confirm-dialog h2 {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 700;
  color: var(--ion-text-color);
}

.confirm-message {
  margin: 0 0 10px;
  font-size: 14px;
  color: var(--ion-text-color2);
  white-space: pre-line;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.confirm-actions button {
  border: none;
  border-radius: 999px;
  padding: 8px 14px;

  font-size: 14px;
  font-weight: 600;

  cursor: pointer;
  transition: transform 120ms ease, filter 120ms ease;
}

.confirm-actions button:active {
  transform: scale(0.98);
}

.confirm-actions button:focus-visible {
  outline: 2px solid rgba(var(--md-accent-rgb, 46, 161, 93), 0.7);
  outline-offset: 2px;
}

.btn-secondary {
  background: #ef4444;
  color: #ffffff;
}

.btn-primary {
  background: var(--md-accent, #2ea15d);
  color: #ffffff;
}

.confirm-input {
  width: 100%;
  margin: 10px 0 16px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.14);
  background: transparent;
  color: var(--ion-text-color);
  outline: none;
}

body.dark .confirm-input {
  border-color: rgba(255, 255, 255, 0.14);
}

@keyframes popup-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (min-width: 820px) {
  .actions {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 14px;
    flex-wrap: nowrap;
    max-width: none;
    margin: 0 auto;
    width: fit-content;
  }

  .actions .btn {
    width: clamp(360px, 46vw, 560px);
    flex: 0 0 auto;
    margin: 0;
  }

  .pantry-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px;
    width: fit-content;
    max-width: none;
    margin: 0 auto;
    margin-top: clamp(20px, 3vh, 40px);
  }

  .pantry-list {
    grid-template-columns: repeat(2, clamp(360px, 46vw, 560px));
  }
}


</style>
