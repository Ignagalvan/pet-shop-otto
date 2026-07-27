import type { Metadata } from 'next'
import { PageHero } from '@/components/page-hero'
import { PetsClient } from '@/components/pets-client'

export const metadata: Metadata = { title: 'Mis mascotas' }

export default function PetsPage() {
  return (
    <>
      <PageHero eyebrow="Mi cuenta · Demo" title="Mis mascotas" description="Perfiles simples para recibir recomendaciones y comprar más rápido." />
      <PetsClient />
    </>
  )
}
