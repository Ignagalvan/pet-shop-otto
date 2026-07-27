import type { Metadata } from 'next'
import { FavoritesClient } from '@/components/favorites-client'
import { PageHero } from '@/components/page-hero'

export const metadata: Metadata = { title: 'Favoritos' }

export default function FavoritesPage() {
  return (
    <>
      <PageHero eyebrow="Tu selección" title="Productos favoritos" description="Guardá lo que más te gusta y volvé cuando quieras." />
      <FavoritesClient />
    </>
  )
}
