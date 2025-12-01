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
        <ion-spinner name="crescent" style="transform:scale(2);"></ion-spinner>
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
            <!-- Botón salir/elimaniar start -->
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
            <!-- Botón salir/elimaniar end -->

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
                  <span class="chip-copy material-icons" aria-hidden="true"
                    >content_copy</span
                  >
                </button>
                <!-- Botón copiar código end -->
              </div>
            </div>
            <!-- Info despensa end -->
          </div>
          <!-- <img src="https://lh3.googleusercontent.com/d/1lnP3os6Rijt8zlK8BlTdlJSqae-y4ZYb" referrerpolicy="no-referrer" alt="Imagen"> -->
        </div>
      </div>
      <!-- Lista de despensas end -->

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
    <PantryModal v-model="openCreateModal" mode="create" @confirm="handleCreate" @close="openCreateModal = false" />
    <!-- Modal reutilizable en modo CREAR end -->

    <!-- Modal reutilizable en modo UNIRSE start -->
    <PantryModal v-model="openJoinModal" mode="join" @confirm="handleJoin" @close="openJoinModal = false" />
    <!-- Modal reutilizable en modo UNIRSE end -->
  </ion-page>

</template>

<script setup lang="ts">
import PantryHeader from '@/components/ui/PantryHeader.vue'
import { IonPage, IonHeader, IonContent, IonSpinner } from '@ionic/vue'
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { collection, query, where, getDocs, addDoc, updateDoc, onSnapshot, type Unsubscribe, increment, orderBy, doc, writeBatch } from 'firebase/firestore'
import { db } from '@/firebase'
import { Pantry } from '@/models/pantry'
import { useRouter } from 'vue-router'
import { showToast } from '@/composables/showToast'
import PantryModal from '@/components/ui/PantryModal.vue'
import ConfirmPopup from '@/components/ui/ConfirmPopup.vue';


// Estado de apertura modal de cada modo
const openCreateModal = ref(false)
const openJoinModal = ref(false)

// Estados popup confirmación eliminar/salir despensa
const showConfirmPantry = ref<boolean>(false)
const selectedPantry = ref<Pantry | null>(null)

// Utility: blur focused element (avoid aria-hidden / autofocus conflicts when opening modals)
function blurActiveElement() {
  try {
    const el = document.activeElement as HTMLElement | null
    if (el && typeof el.blur === 'function') el.blur()
  } catch (e) { console.log('[blurActiveElement] noop catch', e) }
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
const pantryName = ref<string>('');
let stop: Unsubscribe | null = null

const deviceId = getDeviceId();
const router = useRouter()

// const keys = Object.keys(productsMap) as Array<keyof typeof productsMap>;

// Recuperamos toda la información necesaria
onMounted(() => {
  getUserPantries()
  /*
  addComunItems("Aceite de girasol", "https://res.cloudinary.com/dpqgmi3zs/image/upload/v1762341487/aceite_de_girasol_emqm58.png")
  */
})
/*
async function addComunItems(name: string, url: string) {
  await addDoc(collection(db, 'comun_items'), {
    name: name,
    imageUrl: url
  });
  console.log("Agregamos item: " + name + " con url: " + url)
}*/

// Al cerrar la ventana dejaremos de escuchar a firestore
onBeforeUnmount(() => {
  try { stop?.() } catch (e) { console.log('[onBeforeUnmount] error stopping listener', e) }
})

// Re-suscribe si cambian los códigos
watch(codes, (newCodes) => {
  console.log('[codes] changed -> resubscribe', newCodes)
  resubscribe(newCodes)
}, { deep: true })

// Obtenemos el Identificador de nuestro dispositivo
function getDeviceId(): string {
  let id = localStorage.getItem('deviceId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('deviceId', id);
  }
  console.log('Disposito actual:', id)
  return id;
}

// Suscripción en tiempo real según códigos
function resubscribe(codesList: string[]) {
  try { stop?.() } catch (e) { console.log('[resubscribe] error stopping previous listener', e) }

  if (!codesList || codesList.length === 0) {
    console.log('[resubscribe] no codes -> clear list')
    pantries.value = []
    loading.value = false
    return
  }

  // Firestore limita "in" a 10 elementos; si superas, podrías trocear aquí (se mantiene la lógica y solo añadimos si fuese necesario)
  const q = query(collection(db, 'pantries'), where('code', 'in', codesList), orderBy('name', 'asc'))
  stop = onSnapshot(
    q,
    snap => {
      pantries.value = snap.docs.map(d => {
        const pantryData = d.data() as any
        const pantry = {
          id: String(d.id),
          code: String(pantryData.code ?? ''),
          name: String(pantryData.name ?? ''),
          memberCount: Number(pantryData.memberCount ?? 1),
          totalItems: Number(pantryData.totalItems ?? 0),
          creatorId: String(pantryData.creatorId ?? '0000')
        } as Pantry
        return pantry
      })
      // Si alguna despensa ya no existe, la eliminamos del almacenamiento local
      for (const code of [...codesList]) {
        if (!pantries.value.some(p => p.code === code)) {
          deletePantryFromStorage(code)
        }
      }
      console.log('Despensas actuales (snapshot):', pantries.value)
      loading.value = false
    },
    err => {
      console.log('[onSnapshot] error', err)
      error.value = err?.message ?? String(err)
      loading.value = false
    }
  )
}

// Obtenemos todas las despensas que tenga guardadas nuestro
async function getUserPantries() {
  console.log('Mis despensas (storage):', codes.value)
  loading.value = true
  resubscribe(codes.value)
}

/* MODAL ADAPTADO
    El modal nos pasa:  1.handleCreate({ name })  2.handleJoin({ code })
    Llamamos las funciones correspondientes y cerramos el modal.
*/
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


// Crearemos una nueva despensa generando un código aleatorio
async function createPantry() {
  pantryError.value = null

  let name = pantryName.value?.trim() ?? ''

  if (name === '') {
    //pantryError.value = 'El nombre de la despensa es obligatorio.'
    showToast('El nombre de la despensa es obligatorio.', 'danger')
    return
  }
  if (name.length > 25) {
    showToast('El nombre de la despensa es muy largo.', 'danger')
    return
  }

  // Primera letra en mayúscula, resto igual
  name = name.charAt(0).toUpperCase() + name.slice(1)
  try {
    const code = await generatePantryCode()

    const docRef = await addDoc(collection(db, 'pantries'), {
      name,
      code,
      memberCount: 1,
      totalItems: 0,
      creatorId: deviceId
    });

    console.log('Despensa creada en Firestore:', { id: docRef.id, name, code })

    // NO tocamos pantries.value manualmente; el onSnapshot actualizará la UI
    addPantryToStorage(code)
    pantryError.value = null
  } catch (e: any) {
    console.log('[createPantry] error', e)
    pantryError.value = e?.message ?? 'Error al crear la despensa.'
  }
}

// Unirse a despensa por codigo
async function joinPantry(joinCode: string) {
  const code = joinCode?.trim().toUpperCase()
  if (!code) {
    showToast('Introduce un código válido.', 'danger')
    return
  }

  const q = query(collection(db, 'pantries'), where('code', '==', code));
  const snap = await getDocs(q);
  if (snap.empty) {
    showToast('Despensa no encontrada.', 'danger')
    return;
  }

  const pantryRef = snap.docs[0].ref;

  if (pantries.value.some(p => p.id === pantryRef.id)) {
    showToast('Ya estás unido a esta despensa.', 'danger')
    return
  }

  addPantryToStorage(code)

  console.log('Despensa agregada a storage:', { code, pantryId: pantryRef.id })

  // Sumamos 1 al contador de miembros
  try {
    await updateDoc(pantryRef, { memberCount: increment(1) });
  } catch (e) {
    console.log('[joinPantry] error actualizando memberCount', e)
  }
}

// Si somos creadores, eliminaremos la despensa
// Si somos miembros, abandonaremos la despensa
async function deleteOrLeavePantry(joinCode: string) {
  pantryError.value = null

  const code = joinCode?.trim().toUpperCase()
  const q = query(collection(db, 'pantries'), where('code', '==', code));
  const snap = await getDocs(q);

  if (snap.empty) {
    await showToast(`Despensa no encontrada.`, 'danger');
    return;
  }
  const pantryRef = snap.docs[0].ref;
  const pantry = snap.docs[0].data() as any;

  if (pantry.creatorId === deviceId) {
    // Eliminamos despensa + items asociados
    await deletePantryAndItems(pantryRef.id, code);
  } else {
    await updateDoc(pantryRef, { memberCount: increment(-1) });
  }

  // No filtramos la lista manualmente; el snapshot actualizará la UI
  deletePantryFromStorage(code);
}
async function deletePantryAndItems(pantryRef: string, pantryCode: string) {
  const pantryDocRef = doc(db, 'pantries', pantryRef);

  // Los items están en la colección raíz 'items' con campo pantryCode
  const itemsColRef = collection(db, 'items');
  const itemsQ = query(itemsColRef, where('pantryCode', '==', pantryCode));
  const itemsSnap = await getDocs(itemsQ);

  // Borrado en lotes (límite ~500 operaciones por batch)
  const toDelete = itemsSnap.docs.map(d => d.ref);
  const chunkSize = 400; // margen de seguridad
  for (let i = 0; i < toDelete.length; i += chunkSize) {
    const batch = writeBatch(db);
    toDelete.slice(i, i + chunkSize).forEach(ref => batch.delete(ref)); // borra items
    if (i + chunkSize >= toDelete.length) {
      batch.delete(pantryDocRef); // borra la despensa en el último batch
    }
    await batch.commit();
  }

  if (toDelete.length === 0) {
    // Si no había items, borra solo la despensa
    const batch = writeBatch(db);
    batch.delete(pantryDocRef);
    await batch.commit();
  }
}


// Generar código aleatorio de 6 caracteres comprobando que no exista ya
async function generatePantryCode(): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  let exists = true

  while (exists) {
    code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    const q = query(collection(db, 'pantries'), where('code', '==', code))
    const snap = await getDocs(q)
    exists = !snap.empty
  }

  console.log('[generatePantryCode] generado', code)
  return code
}

// Añadir despensa a la lista de despensas del dispositivo
function addPantryToStorage(code: string) {
  const existing: string[] = JSON.parse(localStorage.getItem('myPantries') ?? '[]');
  if (!existing.includes(code)) {
    existing.push(code);
    localStorage.setItem('myPantries', JSON.stringify(existing));
    codes.value = existing; // trigger resubscribe
  } else {
    console.log('[addPantryToStorage] ya existía', code)
  }
}

// Eliminar despensa de la lista de despensas del dispositivo
function deletePantryFromStorage(code: string) {
  const existing: string[] = JSON.parse(localStorage.getItem('myPantries') ?? '[]');
  const updated = existing.filter(c => c !== code);
  localStorage.setItem('myPantries', JSON.stringify(updated));
  codes.value = updated; // trigger resubscribe
  console.log('[deletePantryFromStorage] actualizado storage', updated)
}

// Confirmar eliminar
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
    await showToast(
      isOwner ? 'Despensa eliminada' : 'Has salido de la despensa',
      'success'
    )
  } catch (e: any) {
    console.log('[confirmPantry] error', e)
    await showToast(
      isOwner ? 'Error al eliminar despensa.' : 'Error al abandonar despensa.',
      'danger'
    )
  } finally {
    selectedPantry.value = null
  }
}


// Navegamos al inventario de nuestra despensa
function selectPantry(code: string, name: string) {
  router.push(`/tabs/${code}/${name}/inventory`)
}

function onCardClick(e: MouseEvent, pantry: Pantry) {
  const target = e.target as HTMLElement
  // Si clicas en el botón (o en cualquier hijo del botón), NO navegues
  if (target.closest('.corner-btn')) return
  selectPantry(pantry.code, pantry.name)
}

// NUEVO: copiar el código de la despensa al portapapeles (con fallback y toast)
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
    try { navigator.vibrate?.(15) } catch (e) { console.log('[copyPantryCode] vibrate noop', e) }
    await showToast(`Código copiado: ${code}`, 'success')
  } catch (e) {
    console.log('[copyPantryCode] error', e)
    await showToast('No se pudo copiar el código', 'danger')
  }
}
</script>


<style scoped>
/* Header transparente y sin sombra */
ion-header.rounded-header {
  --background: transparent;
  --ion-background-color: transparent;
  --box-shadow: none;
  background: transparent !important;
  box-shadow: none !important;
  border: 0;
  padding: 0;
  overflow: visible;
}

ion-header.rounded-header::after {
  display: none;
}

/* Contenedor general */
.pantry-content {
  --background: #fff;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Error */
.error-box {
  margin-bottom: 6px;
  text-align: center;
}

.error-box span {
  color: #e53935;
  font-weight: 700;
}

/* Acciones: lado a lado si caben.Si no, se apilan ocupando todo el ancho */
.actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 999px;
  padding: 10px 14px;
  font-weight: 700;
  font-size: 14px;
  border: 2px solid #1f9d55;
  background: transparent;
  color: #1f9d55;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.04);
  width: 100%;
}

.btn-solid {
  background: #1f9d55;
  color: #fff;
}

.btn-outline:hover,
.btn-solid:hover {
  transform: translateY(-1px);
}

.btn-outline:last-child {
  margin-bottom: 5%;
}

/* Loading */
.loading-box {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

/* Lista de despensas */
.pantry-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}


/* Tarjeta de despensa */
.pantry-card {
  position: relative;
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 12px;
  padding: 12px;
  border: 2px solid #2ea15d;
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 2px 0 rgba(31, 157, 85, 0.1);
  cursor: pointer;
  transition: transform .12s ease, box-shadow .12s ease;
}

.pantry-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
}

/* Botón esquina */
.corner-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  border: 0;
  background: #fff;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  box-shadow: inset 0 0 0 2px #e8eef2;
  display: grid;
  place-items: center;
  pointer-events: none;
}

.corner-btn.danger {
  box-shadow: inset 0 0 0 2px #ffdddd;
  color: #e53935;
}

.corner-btn.accent {
  box-shadow: inset 0 0 0 2px #e5f0ff;
  color: #1f9d55;
}

/* Botón de salir/eliminar fijo en esquina de las tarjetas */
.pantry-card {
  position: relative;
}

.corner-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  pointer-events: auto;
}

/* Icono izquierda */
.icon-box {
  display: grid;
  place-items: center;
}

.icon-house {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #e8fbf2;
  border: 2px solid #bde8d1;
  display: grid;
  place-items: center;
  font-size: 60px;
}

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
  color: #1f9d55;
  font-size: 18px;
  font-weight: 800;
}

.meta {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-size: 13px;
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
  opacity: .6;
}

.footer-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 2px;
}

.code-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 10px;
  background: #f4fbf7;
  border: 2px solid #e2f5ea;
  font-weight: 700;
  color: #1f2937;
  font-size: 13px;
}

.copy-btn {
  cursor: pointer;
  border: none;
  background: none;
}

.copy-btn:focus-visible {
  outline: 2px solid #1f9d55;
  outline-offset: 2px;
  border-radius: 12px;
}


.chip-text {
  letter-spacing: .5px;
}

.chip-copy {
  opacity: .8;
}


.items-grid {
  margin-top: 8px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 14px;
}

.item-card {
  text-align: center;
  padding: 10px;
  border-radius: 12px;
  border: 1px solid #eef2f4;
  background: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
}

.item-card img {
  width: 100%;
  height: 100px;
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
  margin: 2px 0 0;
  font-size: 12px;
  color: #6b7280;
}

.icons-red {
  color: #E94031;
}

.pantry-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  flex: 1;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px 16px;
  color: #6b7280;
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
  font-size: 14px;
  color: #3f4146;
  font-weight: 500;
}

</style>
