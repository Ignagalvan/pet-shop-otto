'use client'

import Image from 'next/image'
import Link from 'next/link'
import { X, Plus, Minus, Trash2, ShoppingCart, Truck } from 'lucide-react'
import { useStore } from './store-provider'
import { formatPrice } from '@/lib/format'

export function CartDrawer() {
  const {
    items,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    subtotal,
    cartCount,
    settings,
  } = useStore()

  const active = items.filter((i) => !i.savedForLater)
  const freeShipping = settings.freeShippingThreshold
  const remaining = freeShipping
    ? Math.max(0, freeShipping - subtotal)
    : null
  const progress = freeShipping
    ? Math.min(100, (subtotal / freeShipping) * 100)
    : 0

  if (!isCartOpen) return null

  return (
    <div className="fixed inset-0 z-[70]">
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-in fade-in"
        onClick={closeCart}
      />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-card shadow-2xl animate-in slide-in-from-right">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <ShoppingCart className="size-5 text-brand" />
            Tu carrito
            {cartCount > 0 && (
              <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-bold text-brand">
                {cartCount}
              </span>
            )}
          </h2>
          <button
            onClick={closeCart}
            className="flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary"
            aria-label="Cerrar carrito"
          >
            <X className="size-5" />
          </button>
        </div>

        {active.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <span className="flex size-20 items-center justify-center rounded-full bg-secondary text-brand">
              <ShoppingCart className="size-9" />
            </span>
            <div>
              <p className="text-lg font-bold text-foreground">Tu carrito está vacío</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Descubrí productos ideales para tu mascota.
              </p>
            </div>
            <Link
              href="/productos"
              onClick={closeCart}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-brand px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-brand/90"
            >
              Seguir comprando
            </Link>
          </div>
        ) : (
          <>
            {settings.deliveryEnabled && freeShipping && (
              <div className="border-b border-border bg-secondary/50 px-4 py-3">
              {remaining !== null && remaining > 0 ? (
                <p className="text-xs font-medium text-foreground">
                  El envío es pago. Agregá <span className="font-bold text-brand">{formatPrice(remaining)}</span>{' '}
                  más y pasa a ser gratis.
                </p>
              ) : (
                <p className="flex items-center gap-1.5 text-xs font-bold text-success">
                  <Truck className="size-4" /> ¡Tenés envío gratis!
                </p>
              )}
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-success transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              </div>
            )}

            <ul className="flex-1 divide-y divide-border overflow-y-auto px-4">
              {active.map((item) => (
                <li key={item.key} className="flex gap-3 py-4">
                  <Link
                    href={`/producto/${item.product.slug}`}
                    onClick={closeCart}
                    className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-secondary"
                  >
                    <Image
                      src={item.product.image || '/placeholder.svg'}
                      alt={item.product.name}
                      fill
                      sizes="80px"
                      className="object-contain p-1.5"
                    />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase text-brand">{item.product.brand}</p>
                        <p className="truncate text-sm font-semibold text-foreground">
                          {item.product.name}
                        </p>
                        {item.variantLabel && (
                          <p className="text-xs text-muted-foreground">{item.variantLabel}</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.key)}
                        className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-lg border border-border">
                        <button
                          onClick={() => updateQuantity(item.key, item.quantity - 1)}
                          className="flex size-8 items-center justify-center rounded-l-lg text-foreground transition-colors hover:bg-secondary disabled:opacity-40"
                          disabled={item.quantity <= 1}
                          aria-label="Restar"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.key, item.quantity + 1)}
                          className="flex size-8 items-center justify-center rounded-r-lg text-foreground transition-colors hover:bg-secondary"
                          aria-label="Sumar"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-extrabold text-foreground">
                        {formatPrice(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-xl font-extrabold text-foreground">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <div className="grid gap-2">
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-brand text-sm font-bold text-primary-foreground transition-colors hover:bg-brand/90"
                >
                  Finalizar compra
                </Link>
                <Link
                  href="/carrito"
                  onClick={closeCart}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-border text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
                >
                  Ver carrito
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
