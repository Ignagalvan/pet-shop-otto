'use client'

import Link from 'next/link'
import { Heart } from 'lucide-react'
import { products } from '@/lib/data'
import { useStore } from './store-provider'
import { ProductCard } from './product-card'

export function FavoritesClient() {
  const { favorites } = useStore()
  const selected = products.filter((product) => favorites.includes(product.id))

  if (!selected.length) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
        <span className="flex size-20 items-center justify-center rounded-full bg-secondary text-brand"><Heart className="size-9" /></span>
        <h2 className="mt-5 text-2xl font-extrabold">Todavía no guardaste favoritos</h2>
        <p className="mt-2 text-muted-foreground">Tocá el corazón de un producto para tenerlo siempre a mano.</p>
        <Link href="/productos" className="mt-7 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white">Explorar productos</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <p className="mb-6 text-sm font-semibold text-muted-foreground">{selected.length} productos guardados</p>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {selected.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </div>
  )
}
