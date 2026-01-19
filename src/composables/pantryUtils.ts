import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/firebase'

// Generar código aleatorio de 6 caracteres comprobando que no exista ya
export async function generatePantryCode(): Promise<string> {
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