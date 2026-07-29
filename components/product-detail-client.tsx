'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, ChevronRight, Minus, Plus, ShieldCheck, ShoppingCart, Truck, MessageCircle } from 'lucide-react'
import type { Product } from '@/lib/types'
import { formatPrice, discountPercent } from '@/lib/format'
import { useStore } from './store-provider'
import { ProductCarousel } from './product-carousel'
import { ProductTagBadge, StockBadge } from './product-badges'
import { StarRating } from './star-rating'
import { waLink } from '@/lib/whatsapp'
import { cn } from '@/lib/utils'
import { FavoriteButton } from './favorite-button'

export function ProductDetailClient({ product, related }: { product: Product; related: Product[] }) {
  const router = useRouter()
  const { addToCart, toggleFavorite, isFavorite } = useStore()
  const defaultVariant = product.variants?.find((variant) => variant.price === product.price) ?? product.variants?.[0]
  const [variantId, setVariantId] = useState(defaultVariant?.id)
  const [quantity, setQuantity] = useState(1)
  const selected = product.variants?.find((variant) => variant.id === variantId)
  const price = selected?.price ?? product.price
  const unavailable = product.stock === 'agotado'
  const ordered = product.stock === 'pedido'
  const favorite = isFavorite(product.id)
  const discount = discountPercent(product.price, product.oldPrice)

  const add = () => {
    addToCart(product, {
      variantId: selected?.id,
      variantLabel: selected?.label,
      saleMode: selected?.mode,
      unitPrice: price,
      quantity,
    })
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-10">
        <nav className="mb-6 flex items-center gap-1 overflow-hidden text-xs font-semibold text-muted-foreground">
          <Link href="/" className="hover:text-brand">Inicio</Link><ChevronRight className="size-3.5 shrink-0" />
          <Link href="/productos" className="hover:text-brand">Productos</Link><ChevronRight className="size-3.5 shrink-0" />
          <span className="truncate text-foreground">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
          <section>
            <div className="relative aspect-square overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-secondary/70 to-card">
              <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
                {product.tags.map((tag) => <ProductTagBadge key={tag} tag={tag} />)}
                {discount && <span className="rounded-full bg-promo px-3 py-1 text-xs font-bold text-white">-{discount}%</span>}
              </div>
              <Image src={product.image} alt={product.name} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-contain p-8 sm:p-14" />
            </div>
          </section>

          <section className="flex flex-col justify-center">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-brand">{product.brand}</p>
              <FavoriteButton
                active={favorite}
                onToggle={() => toggleFavorite(product.id)}
                className="size-11 rounded-full border border-border bg-card transition-colors hover:text-promo"
                iconClassName="size-5"
              />
            </div>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{product.name}</h1>
            <div className="mt-4 flex items-center gap-3">
              {product.reviewsCount > 0 && (
                <StarRating rating={product.rating} count={product.reviewsCount} />
              )}
              <span className="text-sm text-muted-foreground">
                Código {product.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <p className="mt-5 leading-7 text-muted-foreground">{product.description}</p>

            {product.variants?.length ? (
              <fieldset className="mt-6">
                <legend className="mb-3 text-sm font-extrabold">Elegí la presentación</legend>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <button key={variant.id} onClick={() => setVariantId(variant.id)} className={cn('rounded-xl border px-4 py-3 text-left transition-all', variant.id === variantId ? 'border-brand bg-brand-light ring-1 ring-brand' : 'border-border bg-card hover:border-brand/50')}>
                      <span className="block text-sm font-bold">{variant.label}</span>
                      <span className="text-xs text-muted-foreground">{formatPrice(variant.price)}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            ) : (
              <p className="mt-5 text-sm font-bold text-muted-foreground">Presentación: {product.presentation}</p>
            )}

            <div className="mt-7 flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-extrabold">{formatPrice(price)}</span>
              {product.oldPrice && price === product.price && <span className="text-base text-muted-foreground line-through">{formatPrice(product.oldPrice)}</span>}
            </div>
            {product.installments && <p className="mt-1 text-sm font-semibold text-success">{product.installments}</p>}
            <div className="mt-4"><StockBadge status={product.stock} count={product.stockCount} /></div>

            <div className="mt-7 flex gap-3">
              <div className="flex h-12 items-center rounded-xl border border-border bg-card">
                <button disabled={quantity === 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="flex size-11 items-center justify-center disabled:opacity-40" aria-label="Restar cantidad"><Minus className="size-4" /></button>
                <span className="w-8 text-center font-extrabold">{quantity}</span>
                <button onClick={() => setQuantity((value) => value + 1)} className="flex size-11 items-center justify-center" aria-label="Sumar cantidad"><Plus className="size-4" /></button>
              </div>
              {unavailable ? (
                <a href={waLink(`Hola, quiero saber cuándo vuelve a ingresar ${product.name}.`)} target="_blank" rel="noreferrer" className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white"><MessageCircle className="size-5" /> Consultar disponibilidad</a>
              ) : ordered ? (
                <Link href={`/pedidos-especiales?producto=${encodeURIComponent(product.name)}`} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-brown px-4 text-sm font-bold text-white"><MessageCircle className="size-5" /> Encargar producto</Link>
              ) : (
                <button onClick={add} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white transition-colors hover:bg-brand/90"><ShoppingCart className="size-5" /> Agregar al carrito</button>
              )}
            </div>
            {!unavailable && !ordered && (
              <button onClick={() => { add(); router.push('/checkout') }} className="mt-3 h-12 w-full rounded-xl border-2 border-brand text-sm font-extrabold text-brand transition-colors hover:bg-brand-light">
                Comprar ahora
              </button>
            )}

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <Info icon={Truck} title="Envío o retiro" text="Coordinamos la opción más cómoda." />
              <Info icon={ShieldCheck} title="Compra segura" text="Pagá online, por transferencia o al recibir." />
            </div>
          </section>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
          <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
            <h2 className="text-2xl font-extrabold">Todo lo que necesitás saber</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {product.benefits.length > 0 && (
                <div>
                  <h3 className="font-bold">Beneficios</h3>
                  <ul className="mt-3 space-y-2">
                    {product.benefits.map((benefit) => <li key={benefit} className="flex gap-2 text-sm text-muted-foreground"><Check className="mt-0.5 size-4 shrink-0 text-success" />{benefit}</li>)}
                  </ul>
                </div>
              )}
              <div>
                <h3 className="font-bold">Características</h3>
                <dl className="mt-3 divide-y divide-border">
                  {product.features.map((feature) => <div key={feature.label} className="flex justify-between gap-4 py-2 text-sm"><dt className="text-muted-foreground">{feature.label}</dt><dd className="font-bold">{feature.value}</dd></div>)}
                </dl>
              </div>
            </div>
            {product.ingredients && <Detail title="Ingredientes" text={product.ingredients} />}
            {product.usage && <Detail title="Modo de uso" text={product.usage} />}
            {product.important && <div className="mt-5 rounded-2xl bg-brown/10 p-4 text-sm leading-6 text-foreground"><strong>Importante: </strong>{product.important}</div>}
          </section>
          {product.reviewsCount > 0 ? (
            <section id="opiniones" className="rounded-3xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-2xl font-extrabold">Opiniones</h2>
              <div className="mt-2"><StarRating rating={product.rating} count={product.reviewsCount} /></div>
              <div className="mt-5 space-y-5">
                {product.reviews?.map((review) => (
                  <article key={review.id} className="border-t border-border pt-5 first:border-0 first:pt-0">
                    <div className="flex justify-between gap-2"><strong className="text-sm">{review.author}</strong><span className="text-xs text-muted-foreground">{review.date}</span></div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{review.text}</p>
                  </article>
                ))}
              </div>
            </section>
          ) : (
            <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-xl font-extrabold">¿Tenés dudas?</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Escribinos por WhatsApp y te ayudamos a confirmar si este producto es el indicado para tu mascota.
              </p>
            </section>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="border-t border-border bg-card/50 py-12">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="text-2xl font-extrabold">También te puede gustar</h2>
            <p className="mt-2 text-sm text-muted-foreground">Productos elegidos para la misma mascota.</p>
            <div className="mt-6"><ProductCarousel products={related} /></div>
          </div>
        </section>
      )}
    </>
  )
}

function Info({ icon: Icon, title, text }: { icon: typeof Truck; title: string; text: string }) {
  return <div className="flex gap-3 rounded-2xl bg-secondary/60 p-4"><Icon className="size-5 shrink-0 text-brand" /><div><p className="text-sm font-extrabold">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p></div></div>
}

function Detail({ title, text }: { title: string; text: string }) {
  return <div className="mt-6 border-t border-border pt-5"><h3 className="font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div>
}
