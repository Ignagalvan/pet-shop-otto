import type { Metadata } from 'next'
import { FavoritesClient } from '@/components/favorites-client'
import { PageHero } from '@/components/page-hero'
import { getPublicProducts } from '@/lib/catalog'

export const metadata: Metadata = { title: 'Favoritos' }

export default async function FavoritesPage() {
  const products = await getPublicProducts()
  return (
    <>
      <PageHero eyebrow="Tu selección" title="Productos favoritos" description="Guardá lo que más te gusta y volvé cuando quieras." />
      <FavoritesClient products={products} />
    </>
  )
}
