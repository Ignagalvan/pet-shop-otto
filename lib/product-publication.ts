export type PublicationProduct = {
  image_path: string | null
  description: string | null
  category_id: number | null
  product_pet_types: Array<{ pet_type_id: number }>
  product_variants: Array<{ active: boolean; sells_by_package: boolean; sells_by_kg: boolean; package_price: number | null; kg_price: number | null }>
}

export function publicationMissingFields(product: PublicationProduct): string[] {
  const missing: string[] = []
  if (!product.image_path?.trim()) missing.push('foto')
  if (!product.description?.trim()) missing.push('descripción')
  if (!product.category_id) missing.push('categoría')
  if (!product.product_pet_types.length) missing.push('mascota')
  if (!product.product_variants.some(v => v.active && ((v.sells_by_package && Number(v.package_price) > 0) || (v.sells_by_kg && Number(v.kg_price) > 0)))) missing.push('precio de venta')
  return missing
}
