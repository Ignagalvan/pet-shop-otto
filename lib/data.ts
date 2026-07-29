import type { CategorySlug, PetType } from './types'

export const BRAND_NAME = 'Pet Shop Otto'
export const BRAND_SUFFIX = ''
export const BRAND_FULL_NAME = [BRAND_NAME, BRAND_SUFFIX].filter(Boolean).join(' ')
export const WHATSAPP_NUMBER = '5491100000000' // Reemplazar por el número real

// Presentación visual de las opciones principales. Los productos ya no viven
// en este archivo: el catálogo público se obtiene desde Supabase.
export const petTypes: { slug: PetType; label: string; image: string }[] = [
  { slug: 'perros', label: 'Perros', image: '/images/pet-dog.png' },
  { slug: 'gatos', label: 'Gatos', image: '/images/pet-cat.png' },
  { slug: 'aves', label: 'Aves', image: '/images/pet-bird.png' },
  { slug: 'roedores', label: 'Roedores', image: '/images/pet-rodent.png' },
  { slug: 'caballos', label: 'Caballos', image: '/images/pet-horse-v2.png' },
  { slug: 'otras', label: 'Otras mascotas', image: '/images/pet-other-v2.png' },
]

export const categories: {
  slug: CategorySlug
  label: string
  icon: string
  description: string
}[] = [
  { slug: 'alimentos', label: 'Alimentos', icon: 'bone', description: 'Balanceados y húmedos' },
  { slug: 'snacks', label: 'Snacks', icon: 'cookie', description: 'Premios y golosinas' },
  { slug: 'juguetes', label: 'Juguetes', icon: 'gamepad-2', description: 'Diversión asegurada' },
  { slug: 'higiene', label: 'Higiene', icon: 'droplets', description: 'Baño y cuidado' },
  { slug: 'camas', label: 'Camas', icon: 'bed-double', description: 'Descanso y confort' },
  { slug: 'paseo', label: 'Paseo', icon: 'footprints', description: 'Correas y arneses' },
  { slug: 'accesorios', label: 'Accesorios', icon: 'shopping-bag', description: 'Comederos y más' },
]

export const needsList: { slug: string; label: string }[] = [
  { slug: 'cachorros', label: 'Cachorros' },
  { slug: 'adultos', label: 'Adultos' },
  { slug: 'senior', label: 'Senior' },
  { slug: 'cuidado-especial', label: 'Cuidado especial' },
  { slug: 'control-peso', label: 'Control de peso' },
  { slug: 'piel-sensible', label: 'Piel sensible' },
]
