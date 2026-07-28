'use client'

import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Product } from '@/lib/types'
import { ProductCard } from './product-card'

export function ProductCarousel({ products }: { products: Product[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)

  function scroll(dir: 1 | -1) {
    const container = ref.current
    if (!container) return

    const firstCard = container.firstElementChild as HTMLElement | null
    const cardWidth = firstCard?.offsetWidth ?? container.clientWidth * 0.84
    container.scrollBy({ left: dir * (cardWidth + 16), behavior: 'smooth' })
  }

  function updateProgress() {
    const container = ref.current
    if (!container) return
    const maxScroll = container.scrollWidth - container.clientWidth
    setProgress(maxScroll > 0 ? container.scrollLeft / maxScroll : 1)
  }

  return (
    <div className="relative">
      <div className="mb-3 hidden items-center justify-end gap-2 sm:flex">
        <button
          onClick={() => scroll(-1)}
          className="flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Anterior"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          onClick={() => scroll(1)}
          className="flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Siguiente"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
      <div
        ref={ref}
        onScroll={updateProgress}
        aria-label="Carrusel de productos. Deslizá horizontalmente para ver más."
        className="no-scrollbar -mx-4 flex touch-pan-x snap-x snap-proximity items-stretch gap-4 overflow-x-auto overscroll-x-contain scroll-smooth px-4 pb-3 pr-[18vw] sm:pr-4"
      >
        {products.map((p) => (
          <div
            key={p.id}
            className="flex min-w-0 basis-[82vw] max-w-[19rem] shrink-0 snap-start sm:basis-[48%] sm:max-w-none lg:basis-[23.5%]"
          >
            <ProductCard product={p} />
          </div>
        ))}
      </div>
      {progress < 0.97 && (
        <div
          className="pointer-events-none absolute inset-y-0 right-[-1rem] w-14 bg-gradient-to-l from-background via-background/70 to-transparent sm:hidden"
          aria-hidden="true"
        />
      )}
      <div className="mt-1 flex flex-col items-center gap-2 sm:hidden">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          Deslizá para ver más
          <ChevronRight className="carousel-hint-arrow size-3.5" aria-hidden="true" />
        </p>
        <div className="h-1 w-24 overflow-hidden rounded-full bg-brand/10" aria-hidden="true">
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-150"
            style={{ width: `${Math.max(24, progress * 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
