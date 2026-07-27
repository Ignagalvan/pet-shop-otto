import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, LockKeyhole } from 'lucide-react'
import { CheckoutClient } from '@/components/checkout-client'

export const metadata: Metadata = { title: 'Finalizar compra' }

export default function CheckoutPage() {
  return (
    <>
      <section className="border-b border-border bg-secondary/45">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:py-8">
          <Link href="/carrito" className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline">
            <ChevronLeft className="size-4" /> Volver al carrito
          </Link>
          <div className="mt-3 flex items-start gap-3">
            <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white">
              <LockKeyhole className="size-5" />
            </span>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-brown">Compra segura</p>
              <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight sm:text-3xl">Finalizá tu pedido</h1>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">Completá tus datos, entrega y forma de pago.</p>
            </div>
          </div>
        </div>
      </section>
      <CheckoutClient />
    </>
  )
}
