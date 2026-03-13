export interface Item {
  id: string
  name: string
  quantity: number
  unit: string
  pantryCode: string
  locationId?: string
  inPurchase: boolean
  imageUrl: string
  notePurchase?: string
  expirationDate?: string
  purchaseQuantity?: number
}