import 'server-only'

import { cache } from 'react'
import type {
  CategorySlug,
  PetType,
  Product,
  StockStatus,
  Variant,
} from './types'
import { createSupabaseServerClient } from './supabase/server'

type NamedRelation = { name: string; slug?: string } | Array<{ name: string; slug?: string }> | null

type PublicProductRow = {
  id: string
  name: string
  slug: string
  description: string | null
  image_path: string | null
  featured: boolean
  on_request: boolean
  brands: NamedRelation
  categories: NamedRelation
  product_pet_types: Array<{ pet_types: NamedRelation }>
  product_variants: Array<{
    id: string
    presentation: string | null
    package_weight_kg: number | null
    package_price: number | null
    kg_price: number | null
    sells_by_package: boolean
    sells_by_kg: boolean
    stock_status: 'available' | 'low' | 'out_of_stock' | 'on_request'
    inventory: { quantity: number } | Array<{ quantity: number }> | null
  }>
}

export type CatalogOption = { slug: string; label: string }

const publicProductSelect = `
  id,
  name,
  slug,
  description,
  image_path,
  featured,
  on_request,
  brands ( name ),
  categories ( name, slug ),
  product_pet_types (
    pet_types ( name, slug )
  ),
  product_variants (
    id,
    presentation,
    package_weight_kg,
    package_price,
    kg_price,
    sells_by_package,
    sells_by_kg,
    stock_status,
    inventory ( quantity )
  )
`

function firstRelation(relation: NamedRelation) {
  return Array.isArray(relation) ? relation[0] : relation
}

function inventoryQuantity(
  inventory: PublicProductRow['product_variants'][number]['inventory'],
) {
  const record = Array.isArray(inventory) ? inventory[0] : inventory
  return Number(record?.quantity ?? 0)
}

function stockStatus(
  value: PublicProductRow['product_variants'][number]['stock_status'],
  onRequest: boolean,
): StockStatus {
  if (onRequest || value === 'on_request') return 'pedido'
  if (value === 'available') return 'disponible'
  if (value === 'low') return 'poco'
  return 'agotado'
}

function imageUrl(baseUrl: string, path: string | null) {
  if (!path) return '/placeholder.svg'
  const encodedPath = path.split('/').map(encodeURIComponent).join('/')
  return `${baseUrl}/storage/v1/object/public/product-images/${encodedPath}`
}

function mapProduct(row: PublicProductRow, baseUrl: string): Product | null {
  const brand = firstRelation(row.brands)
  const category = firstRelation(row.categories)
  const activeVariants = row.product_variants.filter(
    (variant) =>
      (variant.sells_by_package && Number(variant.package_price) > 0) ||
      (variant.sells_by_kg && Number(variant.kg_price) > 0),
  )
  const primary = activeVariants.find((variant) => variant.sells_by_package) ?? activeVariants[0]

  if (!primary || !category?.slug) return null

  const variants: Variant[] = activeVariants.flatMap((variant) => {
    const options: Variant[] = []
    if (variant.sells_by_package && Number(variant.package_price) > 0) {
      options.push({
        id: variant.id,
        label: variant.presentation || 'Presentación',
        price: Number(variant.package_price),
        mode: 'package',
      })
    }
    if (variant.sells_by_kg && Number(variant.kg_price) > 0) {
      options.push({
        id: `${variant.id}:kg`,
        label: '1 kg',
        price: Number(variant.kg_price),
        mode: 'kg',
      })
    }
    return options
  })

  const petTypes = row.product_pet_types
    .map((item) => firstRelation(item.pet_types)?.slug)
    .filter((slug): slug is PetType => Boolean(slug))
  const quantity = inventoryQuantity(primary.inventory)
  const presentation =
    primary.presentation ||
    (primary.package_weight_kg ? `${Number(primary.package_weight_kg)} kg` : 'Unidad')

  return {
    id: row.id,
    defaultVariantId: primary.id,
    defaultSaleMode: primary.sells_by_package ? 'package' : 'kg',
    slug: row.slug,
    name: row.name,
    brand: brand?.name || 'Pet Shop Otto',
    image: imageUrl(baseUrl, row.image_path),
    petTypes,
    category: category.slug as CategorySlug,
    presentation,
    price: Number(primary.package_price ?? primary.kg_price ?? 0),
    stock: stockStatus(primary.stock_status, row.on_request),
    stockCount: quantity,
    lifeStage: 'todos',
    tags: [],
    rating: 0,
    reviewsCount: 0,
    featured: row.featured,
    description: row.description || '',
    benefits: [],
    features: [
      { label: 'Marca', value: brand?.name || 'Pet Shop Otto' },
      { label: 'Presentación', value: presentation },
      ...(primary.package_weight_kg
        ? [{ label: 'Peso', value: `${Number(primary.package_weight_kg)} kg` }]
        : []),
      ...(primary.sells_by_kg
        ? [{ label: 'Venta', value: 'Bolsa cerrada o por kilo' }]
        : []),
    ],
    important: row.on_request
      ? 'Este producto se consigue a pedido. Te confirmamos disponibilidad y condiciones antes de avanzar.'
      : undefined,
    variants: variants.length > 1 ? variants : undefined,
  }
}

async function fetchPublicProducts(slug?: string): Promise<Product[]> {
  const supabase = await createSupabaseServerClient()
  let query = supabase
    .from('products')
    .select(publicProductSelect)
    .eq('published', true)
    .eq('active', true)
    .order('featured', { ascending: false })
    .order('updated_at', { ascending: false })

  if (slug) query = query.eq('slug', slug)

  const { data, error } = await query
  if (error) {
    console.error('No se pudo cargar el catálogo público:', error.message)
    return []
  }

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  return (data as unknown as PublicProductRow[])
    .map((row) => mapProduct(row, baseUrl))
    .filter((product): product is Product => Boolean(product))
}

export const getPublicProducts = cache(async () => fetchPublicProducts())

export const getPublicProduct = cache(async (slug: string) => {
  const products = await fetchPublicProducts(slug)
  return products[0]
})

export async function getRelatedProducts(product: Product) {
  const products = await getPublicProducts()
  return products
    .filter(
      (candidate) =>
        candidate.id !== product.id &&
        (candidate.category === product.category ||
          candidate.petTypes.some((pet) => product.petTypes.includes(pet))),
    )
    .slice(0, 8)
}

export function catalogOptions(products: Product[]) {
  const brands = [...new Set(products.map((product) => product.brand))].sort((a, b) =>
    a.localeCompare(b, 'es'),
  )
  const categories = new Map<string, string>()
  const pets = new Map<string, string>()

  for (const product of products) {
    categories.set(
      product.category,
      product.category
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' '),
    )
    for (const pet of product.petTypes) {
      pets.set(pet, pet === 'otras' ? 'Otras mascotas' : pet.charAt(0).toUpperCase() + pet.slice(1))
    }
  }

  return {
    brands,
    categories: [...categories].map(([slug, label]) => ({ slug, label })),
    petTypes: [...pets].map(([slug, label]) => ({ slug, label })),
  }
}
