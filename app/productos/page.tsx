import type { Metadata } from 'next'
import { CatalogClient } from '@/components/catalog-client'
import { PageHero } from '@/components/page-hero'
import { products } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Productos',
  description: 'Explorá alimentos, juguetes, higiene y accesorios para tu mascota.',
}

type Search = Promise<Record<string, string | string[] | undefined>>

export default async function ProductsPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams
  const read = (key: string) => typeof params[key] === 'string' ? params[key] : undefined

  return (
    <>
      <PageHero
        eyebrow="Comprar fácil"
        title="Encontrá lo mejor para tu mascota"
        description="Elegí para quién estás comprando, contanos qué necesita y te ayudamos a encontrarlo sin vueltas."
        titleHref="#primer-producto"
      />
      <CatalogClient
        products={products}
        initial={{
          q: read('q'),
          mascota: read('mascota'),
          categoria: read('categoria'),
          marca: read('marca'),
          oferta: read('oferta') === 'true',
        }}
      />
    </>
  )
}
