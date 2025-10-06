import { computed, type Ref } from 'vue'
import productsMap from '@/config/products.json'
import type { Item } from '@/models/item'
import type { ItemWithImage } from '@/models/itemWithImage'

const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const keys = Object.keys(productsMap) as Array<keyof typeof productsMap>

export const findImageForName = (name: string): string | null => {
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

/** 👇 Exportación nombrada: showItem */
export function showItem(items: Ref<Item[]>, search: Ref<string>) {
  const itemsWithImage = computed<ItemWithImage[]>(() =>
    items.value.map(item => ({
      ...item,
      image: findImageForName(item.name) ?? 'default.png',
    }))
  )

  const filteredItemsWithImage = computed<ItemWithImage[]>(() => {
    const q = normalize(search.value.trim())
    if (!q) return itemsWithImage.value
    return itemsWithImage.value.filter(it => normalize(it.name).includes(q))
  })

  return {
    normalize,
    findImageForName,
    itemsWithImage,
    filteredItemsWithImage,
  }
}
