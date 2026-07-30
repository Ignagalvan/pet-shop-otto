'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, MessageCircle, BellRing } from 'lucide-react'
import type { Product } from '@/lib/types'
import { formatPrice, discountPercent } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useStore } from './store-provider'
import { useToast } from './toast-provider'
import { ProductTagBadge, StockBadge } from './product-badges'
import { StarRating } from './star-rating'
import { waLink } from '@/lib/whatsapp'
import { FavoriteButton } from './favorite-button'

export function ProductCard({ product }: { product: Product }) {
  const { addToCart, toggleFavorite, isFavorite, settings } = useStore()
  const { toast } = useToast()
  const fav = isFavorite(product.id)
  const discount = discountPercent(product.price, product.oldPrice)
  const soldOut = product.stock === 'agotado'
  const onOrder = product.stock === 'pedido'

  return (
    <article className="group relative flex h-full w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col gap-1.5">
        {product.tags.map((t) => (
          <ProductTagBadge key={t} tag={t} />
        ))}
        {discount && !product.tags.includes('oferta') && (
          <span className="rounded-full bg-promo px-2.5 py-1 text-[11px] font-bold leading-none text-promo-foreground shadow-sm">
            -{discount}%
          </span>
        )}
      </div>

      <FavoriteButton
        active={fav}
        onToggle={() => toggleFavorite(product.id)}
        className="absolute right-3 top-3 z-10 size-9 rounded-full bg-card/90 shadow-sm backdrop-blur transition-colors hover:text-promo"
        iconClassName="size-4.5"
      />

      <Link
        href={`/producto/${product.slug}`}
        className="relative block aspect-[4/3] shrink-0 overflow-hidden bg-secondary/40"
      >
        <Image
          src={product.image || '/placeholder.svg'}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className={cn(
            'object-contain p-4 transition-transform duration-500 group-hover:scale-105',
            soldOut && 'opacity-50 grayscale',
          )}
        />
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <span className="text-xs font-bold uppercase tracking-wide text-brand">
            {product.brand}
          </span>
          {product.reviewsCount > 0 && (
            <StarRating rating={product.rating} count={product.reviewsCount} />
          )}
        </div>

        <Link
          href={`/producto/${product.slug}`}
          className="mt-2 line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-card-foreground transition-colors hover:text-brand"
        >
          {product.name}
        </Link>
        <span className="mt-1 line-clamp-1 min-h-4 text-xs text-muted-foreground">
          {product.presentation}
        </span>

        <div className="pt-4">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="whitespace-nowrap text-lg font-extrabold text-foreground">
              {formatPrice(product.price)}
            </span>
            {product.oldPrice && (
              <span className="whitespace-nowrap text-sm text-muted-foreground line-through">
                {formatPrice(product.oldPrice)}
              </span>
            )}
          </div>
          <div className="mt-1 min-h-8">
            {product.installments && (
              <p className="line-clamp-2 text-xs font-medium leading-4 text-success">
                {product.installments}
              </p>
            )}
          </div>
          <div className="mt-1 flex min-h-5 items-center">
            <StockBadge status={product.stock} count={product.stockCount} />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          {soldOut ? (
            <button
              onClick={() => toast('Te avisaremos cuando vuelva a haber stock', 'info')}
              className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary text-sm font-semibold text-brand transition-colors hover:bg-brand-light"
            >
              <BellRing className="size-4" />
              Avisarme
            </button>
          ) : onOrder ? (
            <Link
              href={`/producto/${product.slug}`}
              className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand text-sm font-semibold text-primary-foreground transition-colors hover:bg-brand/90"
            >
              Ver pedido
            </Link>
          ) : (
            <button
              onClick={() => addToCart(product)}
              className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand text-sm font-semibold text-primary-foreground transition-all hover:bg-brand/90 active:scale-95"
            >
              <ShoppingCart className="size-4" />
              Agregar
            </button>
          )}
          <a
            href={waLink(
              `Hola! Quiero consultar por el producto "${product.name}" (${product.presentation}).`,
              settings.whatsappNumber,
            )}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Consultar por WhatsApp"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-success transition-colors hover:bg-success/10"
          >
            <MessageCircle className="size-4.5" />
          </a>
        </div>
      </div>
    </article>
  )
}
