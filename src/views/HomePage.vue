<template>
  <ion-page>
    <ion-header class="rounded-header">
      <PantryHeader title="MI DESPENSA" />
    </ion-header>
    <ion-content class="ion-padding">
      <!-- Mensaje de error -->
      <div v-if="pantryError" style="margin-bottom:10px; text-align:center;">
        <span style="color:red; font-weight:bold;">{{ pantryError }}</span>
      </div>

      <div v-if="loading" style="display:flex; justify-content:center; align-items:center; height:100%;">
        <ion-spinner name="crescent" style="transform:scale(2);"></ion-spinner>
      </div>
      <div v-else>
        <div style="display:flex; gap:20px; flex-wrap:wrap;">
          <div v-for="(pantry, i) in pantries" :key="i" style="text-align:center;" @click="getPantryItems(pantry.code)">
            <p>{{ pantry.name }} ({{ pantry.code }})</p>
          </div>
        </div>
        <div style="display:flex; gap:20px; flex-wrap:wrap; margin-top:20px;">
          <div v-for="(item, i) in itemsWithImage" :key="i" style="text-align:center;">
            <img :src="`/src/assets/img/products/${item.image}`" :alt="item.name" style="width:120px; height:auto;" />
            <p>{{ item.name }} ({{ item.units }})</p>
          </div>
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
import { collection, query, where, getDocs, addDoc, deleteDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import { db } from '@/firebase'
import { Pantry } from '@/models/pantry'

const pantries = ref<Pantry[]>([])
const error = ref<string | null>(null)
const pantryError = ref<string | null>(null)
const loading = ref<boolean>(false)

const codes: string[] = JSON.parse(localStorage.getItem('myPantries') ?? '[]');
const pantryName = ref<string>('');
let stop: Unsubscribe | null = null

const deviceId = getDeviceId();
const items = ref<Item[]>([])

// Recuperamos toda la información necesaria
onMounted(() => {
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

// pequeña utilidad para simular retraso
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Obtenemos todas las despensas que tenga guardadas nuestro
async function getUserPantries() {
  console.log('Mis despensas', codes)
  loading.value = true
  await sleep(1000) // simulamos carga
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
const createPantry = async () => {
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


// Eliminar despensa (si eres el creador)
const deletePantry = async (code: string) => {
  const q = query(collection(db, 'pantries'), where('code', '==', code));
  const snap = await getDocs(q);
  if (snap.empty) return;

  const docRef = snap.docs[0].ref;
  const pantry = snap.docs[0].data();

  if (pantry.creatorId === deviceId) {
    await deleteDoc(docRef);
  }
  pantries.value = pantries.value.filter(p => p.code !== code);
  removePantryFromStorage(code);
};


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
function removePantryFromStorage(code: string) {
  const existing: string[] = JSON.parse(localStorage.getItem('myPantries') ?? '[]');
  const updated = existing.filter(c => c !== code);
  localStorage.setItem('myPantries', JSON.stringify(updated));
}


// Recuperamos los items de la despensa seleccionada
async function getPantryItems(pantryCode: string) {
  loading.value = true
  await sleep(1500) // simulamos carga
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
/* hace transparente el fondo de ion-header y elimina su sombra/borde rectos */
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
/* quita la fina línea inferior en Android */
ion-header.rounded-header::after { display: none; }
</style>