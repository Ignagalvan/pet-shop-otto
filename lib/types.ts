export type PetType = 'perros' | 'gatos' | 'aves' | 'roedores' | 'caballos' | 'otras'

export type CategorySlug =
  | 'alimentos'
  | 'snacks'
  | 'juguetes'
  | 'higiene'
  | 'camas'
  | 'paseo'
  | 'accesorios'

export type LifeStage = 'cachorro' | 'adulto' | 'senior' | 'todos'

export type StockStatus = 'disponible' | 'poco' | 'agotado' | 'pedido'

export type ProductTag = 'oferta' | 'nuevo' | 'mas-vendido' | 'ultimas'

export interface Variant {
  id: string
  label: string
  price: number
}

export interface Review {
  id: string
  author: string
  rating: number
  date: string
  text: string
}

export interface Product {
  id: string
  slug: string
  name: string
  brand: string
  image: string
  gallery?: string[]
  petTypes: PetType[]
  category: CategorySlug
  presentation: string
  price: number
  oldPrice?: number
  installments?: string
  stock: StockStatus
  stockCount?: number
  lifeStage: LifeStage
  tags: ProductTag[]
  needs?: string[]
  rating: number
  reviewsCount: number
  description: string
  benefits: string[]
  features: { label: string; value: string }[]
  ingredients?: string
  usage?: string
  important?: string
  variants?: Variant[]
  reviews?: Review[]
  featured?: boolean
}
