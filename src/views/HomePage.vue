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
      <div v-else class="pantry-list">
        <div v-for="(pantry, i) in pantries" :key="i" class="pantry-card" @click="onCardClick($event, pantry)">
          <!-- Botón salir/elimaniar start -->
          <button type="button" class="corner-btn" :class="pantry.creatorId === deviceId ? 'danger' : 'accent'"
            @click.stop="onCornerAction(pantry)" title="Acción" aria-label="Acción">
            <span class="material-icons icons-red" v-if="pantry.creatorId === deviceId">delete</span>
            <span class="material-icons icons-red" v-else>logout</span>
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
              <div class="code-chip">
                <span class="chip-text">{{ pantry.code }}</span>
                <span class="chip-copy material-icons">content_copy</span>
              </div>
            </div>
          </div>
          <!-- Info despensa end -->
        </div>
      </div>
      <!-- Lista de despensas end -->
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
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot, type Unsubscribe, increment } from 'firebase/firestore'
import { db } from '@/firebase'
import { Pantry } from '@/models/pantry'
import { useRouter } from 'vue-router'
import { alertController, toastController } from '@ionic/vue'
import PantryModal from '@/components/ui/PantryModal.vue'

// Estado de apertura modal de cada modo
const openCreateModal = ref(false)
const openJoinModal = ref(false)
function openCreate() { openCreateModal.value = true }
function openJoin() { openJoinModal.value = true }

const pantries = ref<Pantry[]>([])
const error = ref<string | null>(null)
const pantryError = ref<string | null>(null)
const loading = ref<boolean>(false)

const codes: string[] = JSON.parse(localStorage.getItem('myPantries') ?? '[]');
const pantryName = ref<string>('');
let stop: Unsubscribe | null = null

const deviceId = getDeviceId();
const router = useRouter()


// Recuperamos toda la información necesaria
onMounted(() => {
  // Datos de ejemplo (forzadoss)
  deletePantryFromStorage('56N31A')
  deletePantryFromStorage('24S331')
  addPantryToStorage('56N31A')
  addPantryToStorage('24S331')
  getUserPantries()
})

// Al cerrar la ventana dejaremos de escuchar a firestore
onBeforeUnmount(() => stop?.())

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

// Obtenemos todas las despensas que tenga guardadas nuestro
async function getUserPantries() {
  console.log('Mis despensas', codes)
  loading.value = true
  if (!codes.length) {
    pantries.value = []
    loading.value = false
    return
  }
  const q = query(collection(db, 'pantries'), where('code', 'in', codes))
  stop = onSnapshot(
    q,
    snap => {
      pantries.value = snap.docs.map(d => {
        const pantry = d.data() as any
        return {
          id: String(d.id),
          code: String(pantry.code ?? ''),
          name: String(pantry.name ?? ''),
          memberCount: Number(pantry.memberCount ?? 1),
          totalItems: Number(pantry.totalItems ?? 0),
          creatorId: String(pantry.creatorId ?? '0000')
        } as Pantry
      })
      console.log('Despensas actuales:', pantries.value)
      loading.value = false
    },
    err => {
      error.value = err?.message ?? String(err)
      loading.value = false
    }
  )
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
    pantryError.value = e?.message ?? 'Error al unirse a la despensa.'
  }
}


// Crearemos una nueva despensa generando un código aleatorio
async function createPantry() {
  pantryError.value = null

  const name = pantryName.value?.trim() ?? ''

  if (name === '') {
    pantryError.value = 'El nombre de la despensa es obligatorio.'
    return
  }
  if (name.length > 25) {
    pantryError.value = 'El nombre de la despensa es muy largo.'
    return
  }

  try {
    const code = await generatePantryCode()

    const docRef = await addDoc(collection(db, 'pantries'), {
      name,
      code,
      memberCount: 1,
      totalItems: 0,
      creatorId: deviceId
    });

    const newPantry = {
      id: docRef.id,
      name,
      code,
      memberCount: 1,
      totalItems: 0,
      creatorId: deviceId
    };

    pantries.value.push(newPantry)
    addPantryToStorage(code)
    console.log('Despensa creada', newPantry)

    pantryError.value = null
  } catch (e: any) {
    pantryError.value = e?.message ?? 'Error al crear la despensa.'
  }
}

// Unirse a despensa por codigo
async function joinPantry(joinCode: string) {
  pantryError.value = null

  const code = joinCode?.trim().toUpperCase()
  if (!code) {
    pantryError.value = 'Introduce un código válido.'
    return
  }

  const q = query(collection(db, 'pantries'), where('code', '==', code));
  const snap = await getDocs(q);
  if (snap.empty) {
    pantryError.value = 'Despensa no encontrada.'
    return;
  }

  const pantryRef = snap.docs[0].ref;
  const pantry = snap.docs[0].data();

  if (pantries.value.some(p => p.id === pantryRef.id)) {
    pantryError.value = 'Ya estás unido a esta despensa.'
    return
  }

  addPantryToStorage(code);
  const newPantry = {
    id: pantryRef.id,
    code: pantry.code,
    name: pantry.name,
    memberCount: pantry.memberCount + 1,
    totalItems: 0,
    creatorId: pantry.creatorId
  }
  pantries.value.push(newPantry)
  console.log('Despensa agregada: ', newPantry)

  // Sumamos 1 al contador de miembros
  await updateDoc(pantryRef, {
    memberCount: increment(1)
  });
}

// Si somos creadores, eliminaremos la despensa
// Si somos miembros, abandonaremos la despensa
async function deleteOrLeavePantry(joinCode: string) {
  pantryError.value = null

  const code = joinCode?.trim().toUpperCase()
  const q = query(collection(db, 'pantries'), where('code', '==', code));
  const snap = await getDocs(q);

  if (snap.empty) {
    await showErrorToast(`Despensa no encontrada.`)
    return;
  }
  const pantryRef = snap.docs[0].ref;
  const pantry = snap.docs[0].data();

  if (pantry.creatorId === deviceId) {
    await deleteDoc(pantryRef);
  } else {
    await updateDoc(pantryRef, {
      memberCount: increment(-1)
    });
  }
  pantries.value = pantries.value.filter(p => p.code !== code);
  deletePantryFromStorage(code);
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

  return code
}

// Añadir despensa a la lista de despensas del dispositivo
function addPantryToStorage(code: string) {
  const existing: string[] = JSON.parse(localStorage.getItem('myPantries') ?? '[]');
  if (!existing.includes(code)) {
    existing.push(code);
    localStorage.setItem('myPantries', JSON.stringify(existing));
  }
}

// Eliminar despensa de la lista de despensas del dispositivo
function deletePantryFromStorage(code: string) {
  const existing: string[] = JSON.parse(localStorage.getItem('myPantries') ?? '[]');
  const updated = existing.filter(c => c !== code);
  localStorage.setItem('myPantries', JSON.stringify(updated));
}

// Confirmar eliminar
async function onCornerAction(pantry: Pantry) {
  const isOwner = pantry.creatorId === deviceId
  const header = isOwner ? 'Eliminar despensa' : 'Salir de la despensa'
  const message = isOwner
    ? `Vas a eliminar definitivamente “${pantry.name}”. Esta acción no se puede deshacer.`
    : `Vas a salir de “${pantry.name}”. Podrás volver con su código.`

  const alert = await alertController.create({
    header,
    message,
    mode: 'ios',
    backdropDismiss: false,
    // 👇 CLASES que irá en el <ion-alert> (host)
    cssClass: ['mds-alert', isOwner ? 'mds-danger' : 'mds-safe'],
    buttons: [
      { text: 'Cancelar', role: 'cancel', cssClass: 'btn-cancel' },
      {
        text: isOwner ? 'Eliminar' : 'Salir',
        role: 'confirm',
        cssClass: isOwner ? 'btn-danger' : 'btn-confirm'
      }
    ],
  })
  await alert.present()

  const { role } = await alert.onDidDismiss()
  if (role !== 'confirm') return

  try {
    await deleteOrLeavePantry(pantry.code)
      ; (await toastController.create({
        message: isOwner ? 'Despensa eliminada' : 'Has salido de la despensa',
        duration: 1800,
      })).present()
  } catch (e: any) {
    pantryError.value = e?.message ?? 'No se pudo completar la acción.'
      ; (await toastController.create({
        message: 'Error al procesar la acción',
        duration: 1800,
        color: 'danger'
      })).present()
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

/* Acciones: lado a lado si caben; si no, se apilan ocupando todo el ancho */
.actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  /* 2+ columnas si caben, si no 1 columna */
  gap: 12px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* centra icono + texto */
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
  /* ocupa todo el ancho de su celda */
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
  gap: 14px;
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

/* Botón esquina (solo visual) */
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
  /* solo visual */
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
  font-size: 22px;
}

/* Texto */
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

.chip-text {
  letter-spacing: .5px;
}

.chip-copy {
  opacity: .8;
}

/* Grid de productos */
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
</style>
