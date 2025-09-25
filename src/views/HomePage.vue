<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Despensas</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div style="display:flex; gap:20px; flex-wrap:wrap;">
        <div v-for="(pantry, i) in pantries" :key="i" style="text-align:center;" @click="getPantryItems(pantry.code)">
          <p>{{ pantry.name }} ({{ pantry.code }})</p>
        </div>
      </div>
    </ion-content>
    <ion-content class="ion-padding">
      <div style="display:flex; gap:20px; flex-wrap:wrap;">
        <div v-for="(item, i) in itemsWithImage" :key="i" style="text-align:center;">
          <img :src="`/src/assets/img/products/${item.image}`" :alt="item.name" style="width:120px; height:auto;" />
          <p>{{ item.name }} ({{ item.units }})</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/vue'
import productsMap from '@/config/products.json'
import type { Item } from '@/models/item'
import type { ItemWithImage } from '@/models/itemWithImage'
import { onMounted, onBeforeUnmount, ref, computed } from 'vue'
import { collection, query, where, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import { db } from '@/firebase'
import { Pantry } from '@/models/pantry'

const deviceId = getDeviceId();
const pantries = ref<Pantry[]>([])
const items = ref<Item[]>([])
const error = ref<string | null>(null)
const codes: string[] = JSON.parse(localStorage.getItem('myPantries') ?? '[]');

let stop: Unsubscribe | null = null

// Recuperamos toda la información necesaria
onMounted(() => {
  getUserPantries()
})

// Al cerrar la ventana dejaremos de escuchar a firestore
onBeforeUnmount(() => stop?.())

function getDeviceId(): string {
  let id = localStorage.getItem('deviceId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('deviceId', id);
  }
  console.log('Disposito actual:', id)
  return id;
}

function getUserPantries() {
  console.log('Mis despensas', codes)
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
    },
    err => {
      error.value = err?.message ?? String(err)
    }
  )
}

// Recuperamos los items de la despensa seleccionada
function getPantryItems(pantryCode: string) {
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
    },
    err => {
      error.value = err?.message ?? String(err)
    }
  )
}

/*
const items: Item[] = [
  { name: 'Plátano de Canarias', units: 6, pantryCode: '56N31A', locationId: 'QgAJafIEA6kOIamjePBW' },
  { name: 'Manzana Fuji', units: 4, pantryCode: 'P001', locationId: 'Despensa' },
  { name: 'Pera Conferencia', units: 5, pantryCode: 'P001', locationId: 'Nevera' },
  { name: 'Lomo de salmón', units: 2, pantryCode: 'P001', locationId: 'Congelador' },
  { name: 'Pan de molde', units: 1, pantryCode: 'P001', locationId: 'Otro' },
  { name: 'Arroz basmati', units: 2, pantryCode: 'P001', locationId: 'Despensa' },
  { name: 'Macarrones', units: 3, pantryCode: 'P001', locationId: 'Despensa' },
  { name: 'Harina de trigo', units: 1, pantryCode: 'P001', locationId: 'Despensa' },
  { name: 'Algo', units: 1, pantryCode: 'P001', locationId: 'Despensa' },
  { name: 'Leche entera', units: 2, pantryCode: 'P001', locationId: 'Nevera' }
];
*/

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
