// Obtiene la letra inicial (en texto) del nombre
export function getInitial(name: string): string {
  const n = (name ?? '').trim()
  if (!n) return '?'
  return n.charAt(0).toUpperCase()
}

// Obtener la unidad de medida en singular o plural según la cantidad
export function getMeasurementUnit(unit: string, quantity: number): string {
  const singular: Record<string, string> = { Gramo: "gramo", Kilogramo: "kilogramo", Mililitro: "mililitro", Litro: "litro",  Unidad: "unidad"};
  const plural: Record<string, string> = { Gramo: "gramos", Kilogramo: "kilogramos",  Mililitro: "mililitros", Litro: "litros", Unidad: "unidades" };
  return quantity === 1 ? singular[unit] : plural[unit];
}

// Optimiza la URL de una imagen para carga automática y calidad automática
export function getOptimizedUrl(url: string | null | undefined): string {
  if (!url) return ''; // o una imagen placeholder

  // Si ya tiene transformaciones, no las duplicamos
  if (url.includes('/upload/f_auto,q_auto')) {
    return url;
  }

  return url.replace('/upload/', '/upload/f_auto,q_auto/');
}

// Función para determinar si la imagen es de galería
export function isImageGalery(imageUrl: string | null | undefined): boolean {
  if (!imageUrl) return false
  return imageUrl.includes('productos_galeria')
}

