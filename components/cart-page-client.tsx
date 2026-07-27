'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Bookmark, Minus, Plus, ShoppingCart, Trash2, Truck } from 'lucide-react'
import { useStore } from './store-provider'
import { formatPrice } from '@/lib/format'

const FREE_SHIPPING = 40000

export function CartPageClient() {
  const { items, subtotal, removeFromCart, updateQuantity, toggleSaveForLater } = useStore()
  const active = items.filter((item) => !item.savedForLater)
  const saved = items.filter((item) => item.savedForLater)
  const shipping = subtotal >= FREE_SHIPPING ? 0 : 4500
  const remaining = Math.max(0, FREE_SHIPPING - subtotal)

  if (!active.length && !saved.length) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
        <span className="flex size-20 items-center justify-center rounded-full bg-secondary text-brand"><ShoppingCart className="size-9" /></span>
        <h2 className="mt-5 text-2xl font-extrabold">Tu carrito está vacío</h2>
        <p className="mt-2 text-muted-foreground">Hay un montón de productos esperándote.</p>
        <Link href="/productos" className="mt-7 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white">Ir al catálogo</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div>
        <h2 className="text-xl font-extrabold">Productos ({active.length})</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
          {active.map((item) => (
            <article key={item.key} className="flex gap-4 border-b border-border p-4 last:border-0 sm:p-5">
              <Link href={`/producto/${item.product.slug}`} className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-secondary sm:size-28">
                <Image src={item.product.image} alt={item.product.name} fill sizes="112px" className="object-contain p-2" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="text-xs font-bold uppercase tracking-wide text-brand">{item.product.brand}</p>
                <Link href={`/producto/${item.product.slug}`} className="mt-1 line-clamp-2 font-bold hover:text-brand">{item.product.name}</Link>
                <p className="mt-1 text-xs text-muted-foreground">{item.variantLabel ?? item.product.presentation}</p>
                <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
                  <div className="flex items-center rounded-xl border border-border">
                    <button disabled={item.quantity === 1} onClick={() => updateQuantity(item.key, item.quantity - 1)} className="flex size-9 items-center justify-center disabled:opacity-40" aria-label="Restar"><Minus className="size-4" /></button>
                    <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.key, item.quantity + 1)} className="flex size-9 items-center justify-center" aria-label="Sumar"><Plus className="size-4" /></button>
                  </div>
                  <span className="text-lg font-extrabold">{formatPrice(item.unitPrice * item.quantity)}</span>
                </div>
                <div className="mt-3 flex gap-4 text-xs font-bold">
                  <button onClick={() => toggleSaveForLater(item.key)} className="flex items-center gap-1 text-brand"><Bookmark className="size-3.5" /> Guardar</button>
                  <button onClick={() => removeFromCart(item.key)} className="flex items-center gap-1 text-destructive"><Trash2 className="size-3.5" /> Eliminar</button>
                </div>
              </div>
            </article>
          ))}
        </div>
        {saved.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-extrabold">Guardados para después</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {saved.map((item) => (
                <div key={item.key} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                  <div className="relative size-16 shrink-0 rounded-xl bg-secondary"><Image src={item.product.image} alt="" fill sizes="64px" className="object-contain p-1" /></div>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{item.product.name}</p><p className="text-xs text-muted-foreground">{formatPrice(item.unitPrice)}</p></div>
                  <button onClick={() => toggleSaveForLater(item.key)} className="rounded-lg bg-secondary px-3 py-2 text-xs font-bold text-brand">Mover</button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <aside className="h-fit rounded-3xl border border-border bg-card p-6 shadow-sm lg:sticky lg:top-36">
        <h2 className="text-xl font-extrabold">Resumen de compra</h2>
        <div className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Envío estimado</span><strong className={shipping === 0 ? 'text-success' : ''}>{shipping === 0 ? 'Gratis' : formatPrice(shipping)}</strong></div>
        </div>
        {remaining > 0 ? (
          <div className="mt-5 rounded-xl bg-secondary p-3 text-xs font-semibold leading-5">
            <Truck className="mr-1 inline size-4 text-brand" />
            El envío cuesta {formatPrice(shipping)}. Agregá {formatPrice(remaining)} más y pasa a ser gratis.
          </div>
        ) : (
          <div className="mt-5 rounded-xl bg-success/10 p-3 text-xs font-bold text-success">
            <Truck className="mr-1 inline size-4" /> Tu compra tiene envío gratis.
          </div>
        )}
        <div className="my-5 border-t border-border" />
        <div className="flex items-baseline justify-between"><span className="font-bold">Total</span><span className="text-2xl font-extrabold">{formatPrice(subtotal + shipping)}</span></div>
        <Link href="/checkout" className="mt-6 flex h-12 items-center justify-center rounded-xl bg-success text-sm font-extrabold text-white transition-colors hover:bg-success/90">Finalizar compra</Link>
        <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">El costo final de envío se confirma según tu ubicación.</p>
      </aside>
    </div>
  )
}
