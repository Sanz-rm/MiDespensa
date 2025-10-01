<template>
  <ion-page>
    <ion-header class="rounded-header">
      <PantryHeader title="MI DESPENSA" />
    </ion-header>

    <ion-content class="ion-padding pantry-content">
      <!-- Mensaje de error -->
      <div v-if="pantryError" class="error-box">
        <span>{{ pantryError }}</span>
      </div>

      <!-- Acciones -->
      <div class="actions">
        <button class="btn btn-solid">
          <span class="material-icons">add</span>
          Nueva Despensa
        </button>
        <button class="btn btn-outline">
          <span class="material-icons">group</span>
          Unirse a Despensa
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-box">
        <ion-spinner name="crescent" style="transform:scale(2);"></ion-spinner>
      </div>

      <!-- Lista de despensas -->
      <div v-else class="pantry-list">
        <div v-for="(pantry, i) in pantries" :key="i" class="pantry-card" @click="selectPantry(pantry.code)">
          <!-- Botón esquina derecha (solo visual) -->
          <button class="corner-btn" :class="pantry.creatorId === deviceId ? 'danger' : 'accent'" @click.stop
            title="Acción" aria-label="Acción">
            <span class="material-icons icons-red" v-if="pantry.creatorId === deviceId">delete</span>
            <span class="material-icons icons-red" v-else>open_in_new</span>
          </button>

          <!-- Icono -->
          <div class="icon-box">
            <div class="icon-house">
              <span class="material-icons">home</span>
            </div>
          </div>

          <!-- Info -->
          <div class="info">
            <div class="title-row">
              <h3 class="name">{{ pantry.name }}</h3>
            </div>
            <div class="meta">
              <div class="meta-item">
                <span class="meta-icon material-icons">group</span>
                <span>
                  {{ pantry.memberCount }}
                  {{ pantry.memberCount === 1 ? 'miembro' : 'miembros' }}
                </span>
              </div>
              <div class="meta-sep">•</div>
              <div class="meta-item">
                <span>Productos</span>
              </div>
            </div>
            <div class="footer-row">
              <div class="code-chip">
                <span class="chip-text">{{ pantry.code }}</span>
                <span class="chip-copy material-icons">content_copy</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Productos de la despensa seleccionada -->
      <div v-if="!loading && itemsWithImage.length" class="items-grid">
        <div v-for="(item, i) in itemsWithImage" :key="i" class="item-card">
          <img :src="`/img/products/${item.image}`" :alt="item.name" />
          <p class="item-name">{{ item.name }}</p>
          <p class="item-units">{{ item.units }} uds</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import PantryHeader from '@/components/ui/PantryHeader.vue'
import { IonPage, IonHeader, IonContent, IonSpinner } from '@ionic/vue'
import productsMap from '@/config/products.json'
import type { Item } from '@/models/item'
import type { ItemWithImage } from '@/models/itemWithImage'
import { onMounted, onBeforeUnmount, ref, computed } from 'vue'
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import { db } from '@/firebase'
import { Pantry } from '@/models/pantry'
import { useRouter } from 'vue-router'

const pantries = ref<Pantry[]>([])
const error = ref<string | null>(null)
const pantryError = ref<string | null>(null)
const loading = ref<boolean>(false)

const codes: string[] = JSON.parse(localStorage.getItem('myPantries') ?? '[]');
const pantryName = ref<string>('');
let stop: Unsubscribe | null = null

const deviceId = getDeviceId();
const items = ref<Item[]>([])
const router = useRouter()


// Recuperamos toda la información necesaria
onMounted(() => {
  getUserPantries()
  deletePantryFromStorage('56N31A')
  deletePantryFromStorage('24S331')
  addPantryToStorage('56N31A')
  addPantryToStorage('24S331')
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
    await addDoc(collection(db, 'pantries'), {
      name,
      code,
      memberCount: 1,
      creatorId: deviceId
    })
    addPantryToStorage(code)
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
    creatorId: pantry.creatorId
  }
  pantries.value.push(newPantry)

  // Sumamos 1 al contador de miembros
  await updateDoc(pantryRef, {
    memberCount: pantry.memberCount + 1
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
    pantryError.value = 'Despensa no encontrada.'
    return;
  }
  const pantryRef = snap.docs[0].ref;
  const pantry = snap.docs[0].data();

  if (pantry.creatorId === deviceId) {
    await deleteDoc(pantryRef);
  } else {
    await updateDoc(pantryRef, {
      memberCount: pantry.memberCount - 1
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

// Navegamos al inventario de nuestra despensa y almacenamos el codigo de la despensa seleccionada
function selectPantry(pantryCode: string) {
  localStorage.setItem('selectedPantry', pantryCode)
  console.log('Despensa seleccionada:', pantryCode)
  router.push({ name: 'inventory', params: { code: pantryCode } })
}

// Recuperamos los items de la despensa seleccionada
async function getPantryItems(pantryCode: string) {
  loading.value = true
  const q = query(collection(db, 'items'), where('pantryCode', '==', pantryCode))
  stop = onSnapshot(
    q,
    snap => {
      items.value = snap.docs.map(d => {
        const item = d.data() as any
        return {
          id: String(d.id),
          name: String(item.name ?? ''),
          units: Number(item.units ?? 0),
          pantryCode: String(item.pantryCode ?? pantryCode),
          locationId: String(item.locationId ?? 'Otro')
        } as Item
      })
      console.log('Productos actuales:', items.value)
      loading.value = false
    },
    err => {
      error.value = err?.message ?? String(err)
      loading.value = false
    }
  )
}
// Devolveremos el item en minusculas y sin tildes
const normalize = (s: string) => {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

// Almacenamos en una lista todas las claves de propiedades
const keys = Object.keys(productsMap) as Array<keyof typeof productsMap>

/**
 * Obtenemos la imagen mas adecuada del item.
 * Normalizaremos nuestras claves e items para comprobar que clave coincide mejor con el item seleccionado.
 * Una vez obtenida la clave con mas coincidencia devolveremos el valor del nombre de la imagen a asociar.
 */
const findImageForName = (name: string): string | null => {
  const n = normalize(name)
  let bestKey: keyof typeof productsMap | null = null
  let bestLen = -1
  for (const key of keys) {
    const nk = normalize(String(key))
    if (n.includes(nk) && nk.length > bestLen) {
      bestKey = key
      bestLen = nk.length
    }
  }
  return bestKey ? productsMap[bestKey] : null
}
// Crearemos una nueva lista de Items pero le añadiremos el campo de imagen para poder mostrarlo correctamente
const itemsWithImage = computed<ItemWithImage[]>(() =>
  items.value.map(item => ({
    ...item,
    image: findImageForName(item.name) ?? 'default.png'
  }))
)
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
  color: red;
}
</style>
