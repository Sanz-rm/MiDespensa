// Obtiene la imagen por la primera letra del nombre
export function getImageFirstLetter(name: string): string {
  const firstLetter = name.charAt(0).toLowerCase()
  const imageUrl = `img/letters/letra_${firstLetter}.png`
  return imageUrl
}

// Obtener la unidad de medida en singular o plural según la cantidad
export function getMeasurementUnit(unit: string, quantity: number): string {
  const singular: Record<string, string> = { Gramo: "gramo", Kilogramo: "kilogramo", Mililitro: "mililitro", Litro: "litro",  Unidad: "unidad"};
  const plural: Record<string, string> = { Gramo: "gramos", Kilogramo: "kilogramos",  Mililitro: "mililitros", Litro: "litros", Unidad: "unidades" };
  return quantity === 1 ? singular[unit] : plural[unit];
}