<template>
  <ion-page>
    <!-- Cabecera start -->
    <ion-header translucent>
      <ion-toolbar class="top-toolbar">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/home" text="Inicio" />
        </ion-buttons>
        <ion-title>Ajustes</ion-title>
      </ion-toolbar>
    </ion-header>
    <!-- Cabecera end -->

    <ion-content fullscreen class="options-content">
      <ion-header collapse="condense">
        <ion-toolbar class="condense-toolbar">
          <ion-title size="large">Ajustes</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="container">
        <!-- Tarjeta cabecera start -->
        <ion-card class="hero-card">
          <ion-card-content class="hero-content">
            <div class="hero-left">
              <div class="app-badge">
                <ion-icon :icon="sparklesOutline" class="hero-icon" />
              </div>
              <div class="hero-text">
                <ion-text class="hero-title">MI DESPENSA</ion-text>
                <ion-text class="hero-subtitle">Personaliza tu experiencia</ion-text>
              </div>
            </div>

            <ion-note class="hero-version">v{{ appVersion }}</ion-note>
          </ion-card-content>
        </ion-card>
        <!-- Tarjeta cabecera end -->

        <!-- Seccion Apariencia start -->
        <ion-list class="list-card">
          <ion-item-divider class="section-divider">Apariencia</ion-item-divider>

          <ion-item lines="full" class="setting-item">
            <ion-icon slot="start" :icon="moonOutline" class="item-icon accent" />
            <ion-label>
              <h2>Tema oscuro</h2>
              <p>Cambia entre claro y oscuro</p>
            </ion-label>
            <ion-toggle :checked="isDark" @ionChange="onThemeToggle" class="accent-toggle" />
          </ion-item>

          <ion-item lines="none" class="setting-item">
            <ion-icon slot="start" :icon="colorPaletteOutline" class="item-icon accent" />
            <ion-label>
              <h2>Color principal</h2>
              <p>Header, acentos e iconos</p>
            </ion-label>

            <div slot="end" class="color-actions">
              <ion-button fill="solid" size="small" class="reset-pill" @click="resetAccentColor">
                Reset
              </ion-button>

              <label class="color-chip" :title="accentColor">
                <input
                  class="color-input"
                  type="color"
                  v-model="accentColor"
                  @input="onAccentColorInput"
                  aria-label="Seleccionar color principal"
                />
              </label>
            </div>
          </ion-item>
        </ion-list>
        <!-- Seccion Apariencia end -->

        <!-- Seccion Datos start -->
        <ion-list inset class="list-card">
          <ion-item-divider class="section-divider">Datos</ion-item-divider>

          <ion-item lines="full" class="setting-item" button @click="onExportData">
            <ion-icon slot="start" :icon="downloadOutline" class="item-icon accent" />
            <ion-label>
              <h2>Exportar</h2>
              <p>Descarga tus datos</p>
            </ion-label>
          </ion-item>

          <!-- NUEVO: Importar debajo de exportar -->
          <ion-item lines="full" class="setting-item" button @click="onImportData">
            <ion-icon slot="start" :icon="cloudUploadOutline" class="item-icon accent" />
            <ion-label>
              <h2>Importar</h2>
              <p>Restaura tus datos desde un archivo</p>
            </ion-label>
          </ion-item>

          <ion-item lines="none" class="setting-item" button @click="onDeleteData">
            <ion-icon slot="start" :icon="trashOutline" class="item-icon accent" />
            <ion-label>
              <h2>Borrar datos</h2>
              <p>Elimina todos los datos locales de la app</p>
            </ion-label>
          </ion-item>
        </ion-list>
        <!-- Seccion Datos end -->

        <!-- Seccion App start -->
        <ion-list inset class="list-card">
          <ion-item-divider class="section-divider">App</ion-item-divider>

          <ion-item lines="full" class="setting-item" button @click="onAbout">
            <ion-icon slot="start" :icon="informationCircleOutline" class="item-icon accent" />
            <ion-label>
              <h2>Acerca de</h2>
              <p>Versión, cambios y soporte</p>
            </ion-label>
          </ion-item>

          <ion-item lines="none" class="setting-item" button @click="onExitApp">
            <ion-icon slot="start" :icon="logOutOutline" class="item-icon accent" />
            <ion-label>
              <h2>Salir de la aplicación</h2>
              <p>Cierra MiDespensa</p>
            </ion-label>
          </ion-item>
        </ion-list>
        <!-- Seccion App end -->

        <!-- NUEVO: input oculto para seleccionar archivo de importación START -->
        <input
          ref="importFileInput"
          type="file"
          accept="application/json,.json"
          class="hidden-file-input"
          @change="onImportFileSelected"
        />
        <!-- NUEVO: input oculto para seleccionar archivo de importación END -->

        <!-- NUEVO: Modal selección despensas a exportar START -->
        <ion-modal :is-open="showExportModal" @didDismiss="closeExportModal">
          <ion-header translucent>
            <ion-toolbar class="modal-toolbar">
              <ion-title>Exportar</ion-title>
              <ion-buttons slot="end">
                <ion-button @click="closeExportModal">Cerrar</ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>

          <ion-content class="ion-padding">
            <div class="export-hint">
              <p class="export-title">Selecciona las despensas a exportar</p>
              <p class="export-subtitle">Debes marcar al menos 1.</p>
            </div>

            <div v-if="exportLoading" class="loading-box">
              <ion-spinner name="crescent" style="transform:scale(2);" />
            </div>

            <ion-list v-else inset class="export-list">
              <ion-item
                v-for="p in exportPantries"
                :key="p.id"
                lines="none"
                class="export-item"
                :class="{ 'export-item--selected': selectedExportCodes.has(p.code) }"
              >
                <ion-checkbox
                  slot="start"
                  class="accent-checkbox"
                  :checked="selectedExportCodes.has(p.code)"
                  @ionChange="toggleExportPantry(p.code, $event)"
                />
                <ion-label>
                  <h2 class="export-name">{{ p.name }}</h2>
                  <p class="export-code">{{ p.code }}</p>
                </ion-label>
              </ion-item>

              <ion-item v-if="!exportPantries.length" lines="none">
                <ion-label>No tienes despensas para exportar.</ion-label>
              </ion-item>
            </ion-list>

            <div class="export-actions">
              <ion-button
                expand="block"
                class="export-btn"
                :disabled="selectedExportCodes.size === 0 || exportingBackup"
                @click="onConfirmExportSelection"
              >
                {{ exportingBackup ? 'Generando...' : 'Continuar' }}
              </ion-button>
              <ion-note class="export-note" v-if="selectedExportCodes.size === 0">
                Selecciona al menos una despensa.
              </ion-note>
            </div>
          </ion-content>
        </ion-modal>
        <!-- NUEVO: Modal selección despensas a exportar END -->

        <!-- NUEVO: Modal selección despensas a importar START -->
        <ion-modal :is-open="showImportModal" @didDismiss="closeImportModal">
          <ion-header translucent>
            <ion-toolbar class="modal-toolbar">
              <ion-title>Importar</ion-title>
              <ion-buttons slot="end">
                <ion-button @click="closeImportModal">Cerrar</ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>

          <ion-content class="ion-padding">
            <div class="export-hint">
              <p class="export-title">Selecciona las despensas a importar</p>
              <p class="export-subtitle">
                Por defecto están todas seleccionadas. Debes marcar al menos 1.
              </p>
            </div>

            <div v-if="importModalLoading" class="loading-box">
              <ion-spinner name="crescent" style="transform:scale(2);" />
            </div>

            <ion-list v-else inset class="export-list">
              <ion-item
                v-for="b in importBundles"
                :key="getImportKey(b)"
                lines="none"
                class="export-item"
                :class="{ 'export-item--selected': selectedImportKeys.has(getImportKey(b)) }"
              >
                <ion-checkbox
                  slot="start"
                  class="accent-checkbox"
                  :checked="selectedImportKeys.has(getImportKey(b))"
                  @ionChange="toggleImportBundle(getImportKey(b), $event)"
                />
                <ion-label>
                  <h2 class="export-name">{{ b.pantry?.name }}</h2>
                  <p class="export-code">{{ b.pantry?.code }}</p>
                </ion-label>
              </ion-item>

              <ion-item v-if="!importBundles.length" lines="none">
                <ion-label>No hay despensas en el archivo.</ion-label>
              </ion-item>
            </ion-list>

            <div class="export-actions">
              <ion-button
                expand="block"
                class="export-btn"
                :disabled="selectedImportKeys.size === 0 || importingBackup"
                @click="onConfirmImportSelection"
              >
                {{ importingBackup ? 'Importando...' : 'Importar' }}
              </ion-button>
              <ion-note class="export-note" v-if="selectedImportKeys.size === 0">
                Selecciona al menos una despensa.
              </ion-note>
            </div>
          </ion-content>
        </ion-modal>
        <!-- NUEVO: Modal selección despensas a importar END -->

        <!-- NUEVO: Alert para decidir qué hacer si la despensa existe START -->
        <div v-if="showImportDecisionPopup" class="confirm-overlay" @click.self="onImportDecisionCancel">
          <div class="confirm-dialog">
            <h2>Despensa encontrada</h2>
            <p class="confirm-message">{{ importDecisionMessage }}</p>

            <div class="confirm-actions">
              <button type="button" class="btn-secondary" @click="onImportDecisionCancel">
                Cancelar
              </button>
              <button type="button" class="btn-accent" @click="onImportDecisionExisting">
                Usar existente
              </button>
              <button type="button" class="btn-primary" @click="onImportDecisionNew">
                Crear nueva
              </button>
            </div>
          </div>
        </div>
        <!-- NUEVO: Alert para decidir qué hacer si la despensa existe END -->

        <!-- Pop up confirmar limpiar caché START -->
        <ConfirmPopup
          v-model="showConfirmDeleteData"
          title="Borrar datos"
          message="Vas a borrar TODOS los datos locales de MiDespensa en este dispositivo (ajustes, caché y almacenamiento interno). Esta acción no se puede deshacer. Si quieres conservar tus datos, haz una copia con “Exportar” antes de continuar. ¿Quieres borrar los datos?"
          confirmLabel="Borrar"
          cancelLabel="Cancelar"
          @confirm="confirmDeleteData"
        />

        <!-- Pop up confirmar limpiar caché END -->

        <!-- Espacio footer start -->
        <!-- Popup "Acerca de" (estilo app) -->
        <div v-if="showAboutPopup" class="confirm-overlay" @click.self="closeAboutPopup">
          <div class="confirm-dialog">
            <h2>Acerca de MiDespensa v{{ appVersion }}</h2>

            <p class="about-title">Notas de la versión</p>
            <p class="about-notes">
              {{ (appReleaseNotes || '').trim() ? appReleaseNotes : 'Sin notas de versión.' }}
            </p>

            <p class="about-footer">{{ appBaseNote }}</p>

            <div class="confirm-actions">
              <button type="button" class="btn-primary" @click="closeAboutPopup">Cerrar</button>
            </div>
          </div>
        </div>

        <div class="footer-space" />
        <!-- Espacio footer end -->
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/firebase'
import type { Pantry } from '@/models/pantry'
import { generatePantryCode } from '@/composables/pantryUtils'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardContent,
  IonText,
  IonNote,
  IonList,
  IonItem,
  IonLabel,
  IonToggle,
  IonIcon,
  IonItemDivider,
  IonButton,
  IonModal,
  IonCheckbox,
  IonSpinner
} from '@ionic/vue'
import { showToast } from '@/composables/showToast'
import {
  colorPaletteOutline,
  informationCircleOutline,
  trashOutline,
  downloadOutline,
  cloudUploadOutline,
  logOutOutline,
  sparklesOutline,
  moonOutline
} from 'ionicons/icons'
import { initTheme, toggleTheme, accentColor, setAccentColor, resetAccentColor } from '@/theme/theme'
import ConfirmPopup from '@/components/ui/ConfirmPopup.vue'

const isDark = ref(false)
const showConfirmDeleteData = ref(false)

function onAccentColorInput() {
  // v-model ya actualiza el ref; esto fuerza validación/normalización por si acaso
  setAccentColor(accentColor.value)
}

onMounted(() => {
  initTheme()
  isDark.value =
    document.body.classList.contains('dark') || document.documentElement.classList.contains('dark')
})

const onThemeToggle = () => {
  toggleTheme()
  isDark.value =
    document.body.classList.contains('dark') || document.documentElement.classList.contains('dark')
}

const appVersion = (import.meta as any).env?.VITE_APP_VERSION ?? '1.0'
const appReleaseNotes = (import.meta as any).env?.VITE_APP_RELEASE_NOTES ?? ''
const appBaseNote = (import.meta as any).env?.VITE_APP_ABOUT_FOOTER ?? ''

const showAboutPopup = ref(false)

const onAbout = () => (showAboutPopup.value = true)
const closeAboutPopup = () => (showAboutPopup.value = false)

/* ===========================
   EXPORTAR / IMPORTAR (UI)
   =========================== */

// NUEVO: estados modal export
const showExportModal = ref(false)
const exportLoading = ref(false)
const exportingBackup = ref(false)
const exportPantries = ref<Pantry[]>([])
const selectedExportCodes = ref<Set<string>>(new Set())

// NUEVO: input file import
const importFileInput = ref<HTMLInputElement | null>(null)
const importingBackup = ref(false)

// NUEVO: Modal import selección
const showImportModal = ref(false)
const importModalLoading = ref(false)
const importBundles = ref<ExportPantryBundle[]>([])
const selectedImportKeys = ref<Set<string>>(new Set())

// NUEVO: Pop up decisión import si existe (estilo app)
const showImportDecisionPopup = ref(false)
const importDecisionMessage = ref('')
let importDecisionResolver: ((v: 'existing' | 'new' | 'cancel') => void) | null = null
let importDecisionFired = false

// Obtenemos el Identificador de nuestro dispositivo (igual que en el otro código)
function getDeviceId(): string {
  let id = localStorage.getItem('deviceId')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('deviceId', id)
  }
  console.log('Disposito actual:', id)
  return id
}
const deviceId = getDeviceId()

// Modelo local para export (evitamos acoplar a otros modelos)
type ExportItem = {
  id: string
  name: string
  quantity: number
  unit: string
  pantryCode: string
  locationId: string | null
  inPurchase: boolean
  imageUrl: string
  expirationDate: any
}
type ExportPantryBundle = {
  pantry: Pantry
  items: ExportItem[]
  wasCreator: boolean
}
type ExportBackup = {
  app: string
  appVersion: string
  exportedAt: string
  pantries: ExportPantryBundle[]
}

// NUEVO: helper para recuperar los códigos del storage (mis despensas)
function getStoredPantryCodes(): string[] {
  try {
    const raw = localStorage.getItem('myPantries')
    const codes = JSON.parse(raw ?? '[]')
    const normalized = Array.isArray(codes)
      ? codes.map((c) => String(c ?? '').trim().toUpperCase()).filter(Boolean)
      : []
    return normalized
  } catch (e) {
    console.log('[getStoredPantryCodes] error parse storage myPantries', e)
    return []
  }
}

// NUEVO: notificar cambios para refrescar Home (sin F5)
function notifyPantriesChanged() {
  try {
    const codes = getStoredPantryCodes()
    window.dispatchEvent(new CustomEvent('myPantriesChanged', { detail: { codes } }))
    console.log('[notifyPantriesChanged] evento lanzado', codes)
  } catch (e) {
    console.log('[notifyPantriesChanged] error', e)
  }
}

// Añadir despensa a la lista de despensas del dispositivo (igual que en tu pantalla de despensas)
function addPantryToStorage(code: string) {
  try {
    const existing: string[] = JSON.parse(localStorage.getItem('myPantries') ?? '[]')
    const normalized = String(code ?? '').trim().toUpperCase()
    if (!normalized) {
      console.log('[addPantryToStorage] code vacío, no se guarda')
      return
    }
    if (!existing.includes(normalized)) {
      existing.push(normalized)
      localStorage.setItem('myPantries', JSON.stringify(existing))
      console.log('[addPantryToStorage] añadido', normalized, existing)
    } else {
      console.log('[addPantryToStorage] ya existía', normalized)
    }

    // NUEVO: para que se refresque Home sin recargar
    notifyPantriesChanged()
  } catch (e) {
    console.log('[addPantryToStorage] error', e)
  }
}

// NUEVO: helper para trocear (Firestore "in" admite máximo 10)
function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

// ✅ NUEVO: al borrar datos, abandonar todas las despensas del dispositivo (memberCount -1)
async function leaveAllPantriesBeforeWipe() {
  try {
    const codes = getStoredPantryCodes()
    if (!codes.length) {
      console.log('[leaveAllPantriesBeforeWipe] no hay despensas en storage')
      return
    }

    const chunks = chunkArray(codes, 10)

    for (const c of chunks) {
      try {
        const q = query(collection(db, 'pantries'), where('code', 'in', c))
        const snap = await getDocs(q)

        for (const d of snap.docs) {
          try {
            const refPantry = doc(db, 'pantries', d.id)
            await updateDoc(refPantry, { memberCount: increment(-1) })
            console.log('[leaveAllPantriesBeforeWipe] memberCount -1', {
              id: d.id,
              code: (d.data() as any)?.code
            })
          } catch (e) {
            console.log('[leaveAllPantriesBeforeWipe] error updateDoc memberCount -1', e)
          }
        }
      } catch (e) {
        console.log('[leaveAllPantriesBeforeWipe] error getDocs chunk', e)
      }
    }
  } catch (e) {
    console.log('[leaveAllPantriesBeforeWipe] error general', e)
  }
}

// Exportar: abre modal con listado de despensas y checkboxes
const onExportData = async () => {
  const codes = getStoredPantryCodes()
  if (!codes.length) {
    await showToast('No tienes despensas en este dispositivo', 'danger')
    return
  }

  showExportModal.value = true
  exportLoading.value = true
  exportingBackup.value = false
  selectedExportCodes.value = new Set()
  exportPantries.value = []

  try {
    const chunks = chunkArray(codes, 10)
    const all: Pantry[] = []

    for (const c of chunks) {
      const q = query(collection(db, 'pantries'), where('code', 'in', c))
      const snap = await getDocs(q)

      snap.docs.forEach((d) => {
        const data = d.data() as any
        all.push({
          id: String(d.id),
          code: String(data.code ?? ''),
          name: String(data.name ?? ''),
          memberCount: Number(data.memberCount ?? 1),
          totalItems: Number(data.totalItems ?? 0),
          creatorId: String(data.creatorId ?? '0000')
        } as Pantry)
      })
    }

    // Ordenar por nombre
    exportPantries.value = all.sort((a, b) =>
      String(a.name ?? '').localeCompare(String(b.name ?? ''), 'es', { sensitivity: 'base' })
    )

    // ✅ NUEVO: por defecto todos los checkboxes marcados
    selectedExportCodes.value = new Set(
      exportPantries.value.map((p) => String(p.code ?? '').trim().toUpperCase())
    )
  } catch (e) {
    console.log('[onExportData] error cargando despensas', e)
    exportPantries.value = []
    selectedExportCodes.value = new Set()
    await showToast('No se pudieron cargar tus despensas', 'danger')
  } finally {
    exportLoading.value = false
  }
}

// NUEVO: Importar -> pedir seleccionar fichero
const onImportData = async () => {
  try {
    if (importingBackup.value) {
      await showToast('Importación en curso…', 'danger')
      return
    }
    const el = importFileInput.value
    if (!el) {
      console.log('[onImportData] importFileInput no existe')
      await showToast('No se pudo abrir el selector de archivo', 'danger')
      return
    }
    // Limpia el valor para poder seleccionar el mismo archivo dos veces seguidas
    el.value = ''
    el.click()
  } catch (e) {
    console.log('[onImportData] error abriendo selector de archivo', e)
    await showToast('No se pudo abrir el selector de archivo', 'danger')
  }
}

// NUEVO: key estable para cada bundle del fichero
function getImportKey(b: ExportPantryBundle) {
  const id = String((b as any)?.pantry?.id ?? '').trim()
  const code = String((b as any)?.pantry?.code ?? '').trim().toUpperCase()
  const name = String((b as any)?.pantry?.name ?? '').trim()
  return id || code || `${name}-${Math.random().toString(16).slice(2)}`
}

// NUEVO: toggle selección import
function toggleImportBundle(key: string, ev: CustomEvent) {
  const checked = !!(ev as any)?.detail?.checked
  const set = new Set(selectedImportKeys.value)
  if (checked) set.add(key)
  else set.delete(key)
  selectedImportKeys.value = set
}

// NUEVO: cerrar modal import
function closeImportModal() {
  showImportModal.value = false
}

// NUEVO: leer fichero seleccionado y abrir modal de selección (por defecto todo seleccionado)
const onImportFileSelected = async (ev: Event) => {
  try {
    const input = ev.target as HTMLInputElement | null
    const file = input?.files?.[0]
    if (!file) {
      console.log('[onImportFileSelected] no se seleccionó archivo')
      return
    }

    importModalLoading.value = true
    importingBackup.value = false

    let text = ''
    try {
      text = await file.text()
    } catch (e) {
      console.log('[onImportFileSelected] error leyendo file.text()', e)
      await showToast('No se pudo leer el archivo', 'danger')
      importModalLoading.value = false
      return
    }

    let backup: ExportBackup | null = null
    try {
      backup = JSON.parse(text) as ExportBackup
    } catch (e) {
      console.log('[onImportFileSelected] JSON inválido', e)
      await showToast('El archivo no es un JSON válido', 'danger')
      importModalLoading.value = false
      return
    }

    // Validaciones básicas
    if (!backup || !Array.isArray((backup as any).pantries)) {
      console.log('[onImportFileSelected] formato inesperado', backup)
      await showToast('El archivo no tiene el formato esperado', 'danger')
      importModalLoading.value = false
      return
    }

    const bundles = (backup as any).pantries as ExportPantryBundle[]
    if (!bundles.length) {
      console.log('[onImportFileSelected] backup sin despensas', backup)
      await showToast('El archivo no contiene despensas', 'danger')
      importModalLoading.value = false
      return
    }

    // NUEVO: abrir modal con todas seleccionadas
    importBundles.value = bundles
    selectedImportKeys.value = new Set(bundles.map((b) => getImportKey(b)))
    showImportModal.value = true
  } catch (e) {
    console.log('[onImportFileSelected] error preparando import', e)
    await showToast('No se pudo preparar la importación', 'danger')
  } finally {
    importModalLoading.value = false
  }
}

// NUEVO: confirmar selección import y ejecutar import real
const onConfirmImportSelection = async () => {
  try {
    if (selectedImportKeys.value.size === 0) {
      await showToast('Selecciona al menos una despensa', 'danger')
      return
    }

    importingBackup.value = true

    const selected = importBundles.value.filter((b) => selectedImportKeys.value.has(getImportKey(b)))

    // Proceso: por cada despensa del backup -> si existe por id, preguntar; si no, crear nueva
    let joinedCount = 0
    let createdCount = 0

    for (const b of selected) {
      const pantry = b?.pantry as Pantry
      const items = Array.isArray((b as any).items) ? ((b as any).items as ExportItem[]) : []

      const pantryId = String((pantry as any)?.id ?? '').trim()
      const pantryName = String((pantry as any)?.name ?? '').trim()
      const pantryCode = String((pantry as any)?.code ?? '').trim().toUpperCase()

      if (!pantryId) {
        console.log('[import] despensa sin id en backup -> se creará nueva', pantry)
        const created = await createNewPantryFromBackup(pantryName, items)
        if (created) createdCount++
        continue
      }

      const refPantry = doc(db, 'pantries', pantryId)
      const snap = await getDoc(refPantry)

      if (snap.exists()) {
        const data = snap.data() as any
        const liveCode = String(data?.code ?? pantryCode).trim().toUpperCase()
        const liveName = String(data?.name ?? pantryName).trim()

        // ✅ NUEVO: si ya la tienes en storage, NO preguntes nada y sáltala
        const alreadyInStorage = getStoredPantryCodes().includes(liveCode)
        if (alreadyInStorage) {
          console.log('[import] ya tienes esta despensa en el dispositivo, se omite', liveCode)
          continue
        }

        // Preguntar qué hacer
        const decision = await askImportDecision(liveName, liveCode)
        if (decision === 'cancel') {
          console.log('[import] usuario canceló la decisión para', liveName, liveCode)
          continue
        }

        if (decision === 'existing') {
          addPantryToStorage(liveCode)

          // Si en el backup ESTE dispositivo era el creador, reasignamos el creatorId al nuevo deviceId
          try {
            const wasCreator = !!(b as any)?.wasCreator
            const backupCreatorId = String((pantry as any)?.creatorId ?? '').trim()
            const currentCreatorId = String((data as any)?.creatorId ?? '').trim()

            // Seguridad: solo reasigna si el creatorId actual coincide con el del backup
            if (wasCreator && backupCreatorId && currentCreatorId === backupCreatorId) {
              await updateDoc(refPantry, { creatorId: deviceId })
              console.log('[import] creatorId reasignado al nuevo deviceId', { liveCode, deviceId })
            }
          } catch (e) {
            console.log('[import] error reasignando creatorId', e)
          }

          try {
            await updateDoc(refPantry, { memberCount: increment(1) })
            console.log('[import] unido a despensa existente, memberCount +1', liveCode)
          } catch (e) {
            console.log('[import] error incrementando memberCount', { liveCode, e })
          }

          joinedCount++
          continue
        }

        // decision === 'new'
        const created = await createNewPantryFromBackup(pantryName || liveName, items)
        if (created) createdCount++
        continue
      }

      // No existe ya por id => crear nueva con datos del backup
      console.log('[import] despensa NO existe por id -> se creará nueva', { pantryId, pantryName, pantryCode })
      const created = await createNewPantryFromBackup(pantryName, items)
      if (created) createdCount++
    }

    const totalDone = createdCount + joinedCount

    if (totalDone === 0) {
      await showToast('No se ha importado ninguna despensa', 'danger')
    } else {
      await showToast(`Importación completada: ${createdCount} creadas, ${joinedCount} unidas`, 'success')
      notifyPantriesChanged()
    }

    closeImportModal()
  } catch (e) {
    console.log('[onConfirmImportSelection] error importando backup', e)
    await showToast('No se pudo importar el archivo', 'danger')
  } finally {
    importingBackup.value = false
  }
}

// NUEVO: pedir decisión al usuario cuando la despensa del backup sigue existiendo
function askImportDecision(name: string, code: string): Promise<'existing' | 'new' | 'cancel'> {
  return new Promise((resolve) => {
    try {
      importDecisionFired = false
      importDecisionResolver = resolve

      importDecisionMessage.value =
        `La despensa “${name}” (${code}) ya existe.\n\n` +
        `Si te unes a la existente, es posible que NO coincida con tu copia de seguridad (puede haber cambios o faltar productos).\n\n` +
        `¿Qué quieres hacer?`

      // ✅ cerrar modal selección para que el popup no quede por debajo
      showImportModal.value = false
      showImportDecisionPopup.value = true
    } catch (e) {
      console.log('[askImportDecision] error creando popup', e)
      resolve('new')
    }
  })
}

function onImportDecisionCancel() {
  if (importDecisionFired) return
  importDecisionFired = true
  console.log('[askImportDecision] cancel')
  importDecisionResolver?.('cancel')
  importDecisionResolver = null
  showImportDecisionPopup.value = false
}

function onImportDecisionExisting() {
  if (importDecisionFired) return
  importDecisionFired = true
  console.log('[askImportDecision] existing')
  importDecisionResolver?.('existing')
  importDecisionResolver = null
  showImportDecisionPopup.value = false
}

function onImportDecisionNew() {
  if (importDecisionFired) return
  importDecisionFired = true
  console.log('[askImportDecision] new')
  importDecisionResolver?.('new')
  importDecisionResolver = null
  showImportDecisionPopup.value = false
}

// NUEVO: normalizar expirationDate desde JSON a Timestamp (si venía como {seconds,nanoseconds})
function normalizeExpirationDate(val: any) {
  try {
    if (!val) return null
    if (val instanceof Timestamp) return val
    if (typeof val === 'object' && typeof val.seconds === 'number') {
      const seconds = Number(val.seconds)
      const nanos = Number(val.nanoseconds ?? 0)
      const ms = seconds * 1000 + Math.floor(nanos / 1_000_000)
      return Timestamp.fromMillis(ms)
    }
    return val
  } catch (e) {
    console.log('[normalizeExpirationDate] error', e)
    return null
  }
}

// NUEVO: crear despensa nueva + items nuevos con pantryCode nuevo
async function createNewPantryFromBackup(nameFromBackup: string, itemsFromBackup: ExportItem[]) {
  try {
    let name = String(nameFromBackup ?? '').trim()
    if (!name) name = 'Despensa importada'

    // Generar código nuevo (usa tu util)
    const newCode = await generatePantryCode()

    // Crear documento de despensa nuevo con ID nuevo (addDoc)
    const totalItems = Array.isArray(itemsFromBackup) ? itemsFromBackup.length : 0
    const pantryDoc = await addDoc(collection(db, 'pantries'), {
      name,
      code: newCode,
      memberCount: 1,
      totalItems: totalItems,
      creatorId: deviceId
    })

    console.log('[createNewPantryFromBackup] despensa creada', { id: pantryDoc.id, name, code: newCode })

    // Crear items con el NUEVO pantryCode
    if (totalItems > 0) {
      await createItemsForNewPantry(newCode, itemsFromBackup)
    }

    // Guardar en storage para participar en esa despensa
    addPantryToStorage(newCode)

    await showToast(`Despensa importada: ${name} (${newCode})`, 'success')
    return true
  } catch (e) {
    console.log('[createNewPantryFromBackup] error', e)
    await showToast('No se pudo crear la despensa importada', 'danger')
    return false
  }
}

// NUEVO: crear items en batches (por límite de writeBatch)
async function createItemsForNewPantry(newPantryCode: string, items: ExportItem[]) {
  try {
    const safeItems = Array.isArray(items) ? items : []
    const chunkSize = 400

    for (let i = 0; i < safeItems.length; i += chunkSize) {
      const batch = writeBatch(db)
      const slice = safeItems.slice(i, i + chunkSize)

      slice.forEach((it) => {
        const newRef = doc(collection(db, 'items'))
        batch.set(newRef, {
          name: String(it?.name ?? ''),
          pantryCode: newPantryCode,
          quantity: Number(it?.quantity ?? 1),
          unit: String(it?.unit ?? 'Unidad'),
          inPurchase: Boolean(it?.inPurchase ?? false),
          imageUrl: String(it?.imageUrl ?? ''),
          locationId: it?.locationId ?? null,
          expirationDate: normalizeExpirationDate(it?.expirationDate ?? null)
        })
      })

      await batch.commit()
      console.log('[createItemsForNewPantry] batch commit ok', {
        pantryCode: newPantryCode,
        from: i,
        count: slice.length
      })
    }
  } catch (e) {
    console.log('[createItemsForNewPantry] error', e)
    throw e
  }
}

// NUEVO: cerrar modal
function closeExportModal() {
  showExportModal.value = false
}

// NUEVO: toggle checkbox
function toggleExportPantry(code: string, ev: CustomEvent) {
  const checked = !!(ev as any)?.detail?.checked
  const set = new Set(selectedExportCodes.value)

  if (checked) set.add(code)
  else set.delete(code)

  selectedExportCodes.value = set
}

// NUEVO: descarga backup en web / escribe archivo en móvil si existe plugin
async function saveBackupToFile(backup: ExportBackup) {
  const fileName = `midespensa_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  const content = JSON.stringify(backup, null, 2)

  // WEB: descargar como fichero
  if (Capacitor.getPlatform() === 'web') {
    try {
      const blob = new Blob([content], { type: 'application/json;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      console.log('[saveBackupToFile] backup descargado', fileName)
      return
    } catch (e) {
      console.log('[saveBackupToFile] error descargando backup en web', e)
      throw e
    }
  }

  // MÓVIL: intentar Filesystem si existe (si no, toast)
  try {
    const mod = await import('@capacitor/filesystem')
    const { Filesystem, Directory, Encoding } = mod as any

    // Guardar en Documents (como ya hacías)
    await Filesystem.writeFile({
      path: fileName,
      data: content,
      directory: Directory.Documents,
      encoding: Encoding.UTF8
    })
    console.log('[saveBackupToFile] backup guardado en Documents', fileName)

    // NUEVO: abrir "Compartir" para que puedas guardarlo en Descargas/Drive/Archivos
    // y normalmente te aparece más fácil en "Recientes" del gestor.
    try {
      const shareMod = await import('@capacitor/share')
      const { Share } = shareMod as any

      // Obtener una URI compartible del fichero
      let fileUri = ''
      try {
        const uriRes = await Filesystem.getUri({
          directory: Directory.Documents,
          path: fileName
        })
        fileUri = String(uriRes?.uri ?? '')
      } catch (e) {
        console.log('[saveBackupToFile] no se pudo obtener uri del fichero', e)
      }

      if (fileUri) {
        await Share.share({
          title: 'Copia de seguridad MiDespensa',
          text: 'Copia de seguridad (.json) de MiDespensa',
          url: fileUri,
          dialogTitle: 'Guardar/Compartir copia'
        })
        console.log('[saveBackupToFile] share abierto', fileUri)
      } else {
        // Si no hay URI, al menos avisamos dónde está
        await showToast('Guardado en Documentos. Busca “midespensa_backup”.', 'medium')
      }
    } catch (e) {
      // Si no tienes instalado @capacitor/share o falla, no rompemos export.
      console.log('[saveBackupToFile] Share no disponible o error', e)
      await showToast('Guardado en Documentos. Busca “midespensa_backup”.', 'medium')
    }
  } catch (e) {
    console.log('[saveBackupToFile] Filesystem no disponible o error escribiendo archivo', e)
    await showToast(
      'No se pudo guardar el archivo en este dispositivo (pendiente de configurar Filesystem)',
      'danger'
    )
    throw e
  }
}

// NUEVO: recuperar items por pantryCode (getDocs, no snapshot)
async function getItemsForPantry(pantryCode: string): Promise<ExportItem[]> {
  try {
    const q = query(collection(db, 'items'), where('pantryCode', '==', pantryCode), orderBy('name', 'asc'))
    const snap = await getDocs(q)

    const items = snap.docs.map((d) => {
      const item = d.data() as any
      return {
        id: String(d.id),
        name: String(item.name ?? ''),
        quantity: Number(item.quantity ?? 1),
        unit: String(item.unit ?? 'Unidad'),
        pantryCode: String(item.pantryCode ?? pantryCode),
        locationId: item.locationId ?? null,
        inPurchase: Boolean(item.inPurchase ?? false),
        imageUrl: String(item.imageUrl ?? ''),
        expirationDate: item.expirationDate ?? null
      } as ExportItem
    })

    console.log(`[getItemsForPantry] items obtenidos para ${pantryCode}:`, items.length)
    return items
  } catch (e) {
    console.log('[getItemsForPantry] error al recuperar items', { pantryCode, e })
    throw e
  }
}

// NUEVO: al confirmar selección -> recuperar items y generar backup
const onConfirmExportSelection = async () => {
  if (selectedExportCodes.value.size === 0) {
    await showToast('Selecciona al menos una despensa', 'danger')
    return
  }

  const selected = exportPantries.value.filter((p) => selectedExportCodes.value.has(p.code))

  try {
    exportingBackup.value = true
    // Recuperar items de cada despensa seleccionada
    const bundles: ExportPantryBundle[] = await Promise.all(
      selected.map(async (p) => {
        const items = await getItemsForPantry(p.code)
        const wasCreator = String((p as any)?.creatorId ?? '').trim() === String(deviceId).trim()
        return { pantry: p, items, wasCreator }
      })
    )

    const backup: ExportBackup = {
      app: 'MiDespensa',
      appVersion: String(appVersion ?? '1'),
      exportedAt: new Date().toISOString(),
      pantries: bundles
    }

    // Guardar en fichero (web descarga / móvil Filesystem si está)
    await saveBackupToFile(backup)

    await showToast('Copia de seguridad generada', 'success')
    closeExportModal()
  } catch (e) {
    console.log('[onConfirmExportSelection] error exportando backup', e)
    await showToast('No se pudo generar la copia de seguridad', 'danger')
  } finally {
    exportingBackup.value = false
  }
}

const onDeleteData = async () => {
  showConfirmDeleteData.value = true
}

async function confirmDeleteData() {
  try {
    // ✅ NUEVO: Antes de borrar todo, abandonar todas las despensas del dispositivo (memberCount -1)
    await leaveAllPantriesBeforeWipe()

    // 1) Limpieza común (web + móvil): Preferences (Capacitor)
    await Preferences.clear()

    // 2) Local / Session storage (también en móvil: WebView usa estos storages)
    try {
      localStorage.clear()
    } catch (e) {
      console.log('No se pudo limpiar localStorage', e)
    }

    try {
      sessionStorage.clear()
    } catch (e) {
      console.log('No se pudo limpiar sessionStorage', e)
    }

    // 3) Cache Storage (si existe)
    try {
      if ('caches' in window) {
        const keys = await caches.keys()
        await Promise.all(keys.map((k) => caches.delete(k)))
      }
    } catch (e) {
      console.log('No se pudo limpiar Cache Storage', e)
    }

    // 4) IndexedDB (WEB y también Android WebView)
    try {
      const anyIDB = indexedDB as any
      if (anyIDB?.databases) {
        const dbs = await anyIDB.databases()
        await Promise.all(
          (dbs || [])
            .filter((d: any) => d?.name)
            .map(
              (d: any) =>
                new Promise<void>((res) => {
                  const req = indexedDB.deleteDatabase(d.name)
                  req.onsuccess = () => res()
                  req.onerror = () => res()
                  req.onblocked = () => res()
                })
            )
        )
      }
    } catch (e) {
      console.log('No se pudo limpiar IndexedDB', e)
    }

    // 5) MÓVIL: borrar almacenamiento interno (Cache/Data) si Filesystem está disponible
    // (Esto es lo que te faltaba para que en APK “borrase de verdad”)
    if (Capacitor.getPlatform() !== 'web') {
      try {
        const fsMod = await import('@capacitor/filesystem')
        const { Filesystem, Directory } = fsMod as any

        // Helper: intenta borrar raíz del directorio; si falla, borra contenido.
        const wipeDir = async (directory: any, label: string) => {
          try {
            await Filesystem.rmdir({ path: '', directory, recursive: true })
            console.log(`[confirmDeleteData] rmdir OK ${label}`)
            return
          } catch (e) {
            console.log(`[confirmDeleteData] rmdir falló ${label}, intento borrar contenido`, e)
          }

          try {
            const res = await Filesystem.readdir({ path: '', directory })
            const list = (res as any)?.files ?? (res as any)?.entries ?? []
            for (const it of list) {
              const name = typeof it === 'string' ? it : String(it?.name ?? '')
              if (!name) continue

              // Intento como fichero
              try {
                await Filesystem.deleteFile({ path: name, directory })
                continue
              } catch {
                console.log(`[confirmDeleteData] deleteFile falló ${label} ${name}, intento como carpeta`)
              }

              // Si no era fichero, intento como carpeta
              try {
                await Filesystem.rmdir({ path: name, directory, recursive: true })
              } catch {
                console.log(`[confirmDeleteData] rmdir falló ${label} ${name}`)
              }
            }
            console.log(`[confirmDeleteData] wipe contenido OK ${label}`)
          } catch (e) {
            console.log(`[confirmDeleteData] no se pudo borrar contenido ${label}`, e)
          }
        }

        // OJO: NO tocamos Directory.Documents para no borrar tus backups exportados
        await wipeDir(Directory.Cache, 'Directory.Cache')
        await wipeDir(Directory.Data, 'Directory.Data')
      } catch (e) {
        console.log('[confirmDeleteData] Filesystem no disponible o error', e)
      }
    }

    // 6) Service Workers (solo web)
    if (Capacitor.getPlatform() === 'web') {
      try {
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations()
          await Promise.all(regs.map((r) => r.unregister()))
        }
      } catch (e) {
        console.log('No se pudieron desregistrar los Service Workers', e)
      }
    }

    await showToast('Datos borrados correctamente', 'success')

    // 7) Recargar para arrancar “como recién instalada”
    setTimeout(() => {
      try {
        window.location.reload()
      } catch (e) {
        console.log('[confirmDeleteData] no se pudo recargar', e)
      }
    }, 250)
  } catch (e) {
    console.log('[confirmDeleteData] error', e)
    await showToast('No se pudieron borrar los datos', 'danger')
  }
}

const onExitApp = async () => {
  try {
    const mod = await import('@capacitor/app')
    await mod.App.exitApp()
  } catch (e) {
    console.log('[onExitApp] no disponible / error', e)
    showToast('Salir de la app solo está disponible en móvil', 'danger')
  }
}
</script>

<style scoped>
/* FONDO PAGINA */
.options-content {
  --background: linear-gradient(180deg, rgba(var(--md-accent-rgb, 46, 161, 93), 0.08), rgba(0, 0, 0, 0));
}

/* TOOLBARS */
.top-toolbar,
.condense-toolbar {
  --background: var(--md-accent, #2ea15d);
  --color: #ffffff;

  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.top-toolbar ion-title,
.condense-toolbar ion-title,
.top-toolbar ion-back-button,
.top-toolbar ion-button,
.top-toolbar ion-icon,
.condense-toolbar ion-button,
.condense-toolbar ion-icon {
  color: #ffffff !important;
}

ion-back-button {
  --color: #ffffff;
}

/* CONTENEDOR */
.container {
  padding: 14px 14px 0;
}

/* HEADER */
.hero-card {
  margin: 8px 0 14px;
  border-radius: 18px;

  border: 1px solid rgba(var(--md-accent-rgb, 46, 161, 93), 0.18);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
}

.hero-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.hero-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* ICONO BCON BADGE */
.app-badge {
  width: 44px;
  height: 44px;

  display: grid;
  place-items: center;

  border-radius: 14px;
  border: 1px solid var(--md-accent, #2ea15d);
  background: var(--md-accent, #a12e2e);

  font-size: 22px;
}

.hero-icon {
  color: #ffffff;
}

.hero-text {
  display: grid;
  gap: 4px;
  line-height: 1.1;
}

.hero-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--ion-text-color2);
}

.hero-subtitle {
  font-size: 13px;
  color: var(--ion-text-color);
}

.hero-version {
  font-weight: 500;
  color: var(--ion-text-color, #ffffff);
  opacity: 1;
}

/* CONTENEDOR DE TARJETAS */
ion-list.list-card {
  margin: 0 0 14px !important;

  border-radius: 18px !important;
  overflow: hidden !important;

  border: 1px solid rgba(0, 0, 0, 0.06) !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04) !important;
}

/* DIVISOR DE SECCIONES */
.section-divider {
  font-size: 12px;
  letter-spacing: 0.5px;
  text-transform: uppercase;

  color: var(--ion-text-color) !important;
}

ion-item.setting-item {
  --padding-start: 14px;
  --inner-padding-end: 15px;
  --min-height: 56px;
}

/* ICONOS */
.item-icon {
  font-size: 26px;
  margin-left: 3%;
}

.accent {
  color: var(--md-accent, #2ea15d) !important;
}

/* ACTIVA TEMA OSCURO */
.accent-toggle {
  margin-left: 4%;

  --handle-background: #ffffff;
  --handle-background-checked: var(--md-accent, #2ea15d);

  --track-background: rgba(169, 169, 169, 0.35);
  --track-background-checked: rgba(92, 92, 92, 0.42);

  --background: rgba(169, 169, 169, 0.35);
  --background-checked: rgba(169, 169, 169, 0.35);
}

body.dark .accent-toggle {
  --track-background: rgba(255, 255, 255, 0.22);
  --track-background-checked: rgba(206, 206, 206, 0.22);

  --background: rgba(255, 255, 255, 0.22);
  --background-checked: rgba(255, 255, 255, 0.22);

  --handle-background: #ffffff;
  --handle-background-checked: var(--md-accent, #2ea15d);
}

.color-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

/* RESETAR TEMA POR DEFECTO */
.reset-pill {
  height: 30px;

  font-weight: 800;
  text-transform: none;

  --border-radius: 999px;
  --padding-start: 12px;
  --padding-end: 12px;

  --background: rgba(var(--md-accent-rgb, 46, 161, 93), 0.14);
  --background-hover: rgba(var(--md-accent-rgb, 46, 161, 93), 0.2);
  --color: var(--md-accent, #2ea15d);
}

body.dark .reset-pill {
  --background: rgba(var(--md-accent-rgb, 46, 161, 93), 0.14);
  --background-hover: rgba(var(--md-accent-rgb, 46, 161, 93), 0.2);
  --color: var(--md-accent, #2ea15d);
}

/* SELECTOR DE COLOR */
.color-chip {
  width: 34px;
  height: 34px;

  display: inline-grid;
  place-items: center;

  border-radius: 10px;
  overflow: hidden;

  background: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.9);
}

body.dark .color-chip {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid #000000;
}

.color-input {
  width: 34px;
  height: 34px;

  border: 0;
  padding: 0;
  margin: 0;

  background: transparent;
  cursor: pointer;
  outline: none;

  -webkit-appearance: none;
  appearance: none;
}

.color-input::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-input::-webkit-color-swatch,
.color-input::-moz-color-swatch {
  border: 0;
  border-radius: 10px;
}

/* FOOTER ESPACIADO */
.footer-space {
  height: 18px;
}

/* NUEVO: input file oculto */
.hidden-file-input {
  display: none;
}

/* NUEVO: estilos modal export */
.modal-toolbar {
  --background: var(--md-accent, #2ea15d);
  --color: #ffffff;
}

.export-hint {
  margin-bottom: 10px;
}

.export-title {
  font-weight: 700;
  margin: 0;
}

.export-subtitle {
  margin: 4px 0 0;
  opacity: 0.8;
  font-size: 13px;
}

.export-actions {
  margin-top: 14px;
}

.export-note {
  display: block;
  text-align: center;
  margin-top: 8px;
  opacity: 0.75;
}

.export-name {
  font-weight: 650;
}

.export-code {
  opacity: 0.75;
}

.export-btn {
  --border-radius: 14px;

  /* ✅ usar color principal en vez de azul */
  --background: var(--md-accent, #2ea15d);
  --color: #ffffff;

  --background-activated: rgba(var(--md-accent-rgb, 46, 161, 93), 0.85);
  --background-focused: rgba(var(--md-accent-rgb, 46, 161, 93), 0.92);
}

/* ✅ NUEVO: filas (export/import) con borde y “card” + resalte */
:deep(ion-list.export-list) {
  --background: transparent;
}

:deep(ion-item.export-item) {
  margin: 10px 0;
  border-radius: 16px;
  overflow: hidden;

  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.06);

  --background: rgba(var(--md-accent-rgb, 46, 161, 93), 0.06);
  --padding-start: 14px;
  --inner-padding-end: 14px;
  --min-height: 66px;
}

:deep(ion-item.export-item.export-item--selected) {
  border-color: rgba(var(--md-accent-rgb, 46, 161, 93), 0.45);
  --background: rgba(var(--md-accent-rgb, 46, 161, 93), 0.10);
}

:deep(body.dark ion-item.export-item) {
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.25);
  --background: rgba(255, 255, 255, 0.04);
}

:deep(body.dark ion-item.export-item.export-item--selected) {
  border-color: rgba(var(--md-accent-rgb, 46, 161, 93), 0.55);
  box-shadow: 0 0 0 3px rgba(var(--md-accent-rgb, 46, 161, 93), 0.22);
  --background: rgba(var(--md-accent-rgb, 46, 161, 93), 0.12);
}

/* ✅ checkbox verde principal */
:deep(ion-checkbox.accent-checkbox) {
  --checkbox-background: var(--md-accent, #2ea15d);
  --checkbox-background-checked: var(--md-accent, #2ea15d);
  --border-color: rgba(var(--md-accent-rgb, 46, 161, 93), 0.45);
  --border-color-checked: var(--md-accent, #2ea15d);
  --checkmark-color: #ffffff;
}

/* ====== POPUP IMPORT (estilo app, tipo ConfirmPopup) ====== */
/* OVERLAY CONFIRMAR */
.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;

  display: flex;
  align-items: center;
  justify-content: center;

  background: rgba(15, 23, 42, 0.45);
}

/* CONTENEDOR CONFIRMAR */
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
  margin: 0 0 16px;
  font-size: 14px;
  color: var(--ion-text-color2);
  white-space: pre-line;
  /* RESPETA \n */
}

/* BOTONES */
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

/* BOTON CANCELAR */
.btn-secondary {
  background: rgba(148, 163, 184, 0.35);
  color: var(--ion-text-color);
}

/* BOTON USAR EXISTENTE */
.btn-accent {
  background: rgba(var(--md-accent-rgb, 46, 161, 93), 0.14);
  color: var(--md-accent, #2ea15d);
  border: 1px solid rgba(var(--md-accent-rgb, 46, 161, 93), 0.22);
}

/* BOTON CREAR NUEVA */
.btn-primary {
  background: var(--md-accent, #2ea15d);
  color: #ffffff;
}

/* ANIMACIÓN POPUP */
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

.about-app {
  margin: 0 0 12px;
  font-size: 14px;
  color: var(--ion-text-color2);
}

.about-name {
  font-weight: 800;
  color: var(--ion-text-color);
}

.about-title {
  margin: 0 0 6px;
  font-weight: 700;
  font-size: 14px;
  color: var(--ion-text-color);
}

.about-notes {
  margin: 0 0 14px;
  font-size: 14px;
  color: var(--ion-text-color2);
  white-space: pre-line;
  max-height: 180px;
  overflow: auto;
  padding-right: 6px;
}

.about-footer {
  margin: 0 0 14px;
  font-size: 13px;
  color: var(--ion-text-color2);
  opacity: 0.9;
}
</style>
