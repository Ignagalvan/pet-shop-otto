import type { Metadata } from 'next'
import { CartPageClient } from '@/components/cart-page-client'
import { PageHero } from '@/components/page-hero'

export const metadata: Metadata = { title: 'Carrito' }

export default function CartPage() {
  return (
    <>
      <PageHero eyebrow="Tu compra" title="Carrito" description="Revisá tus productos, cantidades y forma de entrega antes de continuar." />
      <CartPageClient />
    </>
  )
}
