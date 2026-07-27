'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Search, X } from 'lucide-react'
import { products } from '@/lib/data'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'

export function SearchBar({
  className,
  autoFocus = false,
  onNavigate,
}: {
  className?: string
  autoFocus?: boolean
  onNavigate?: () => void
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q),
      )
      .slice(0, 5)
  }, [query])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    setOpen(false)
    onNavigate?.()
    router.push(q ? `/productos?q=${encodeURIComponent(q)}` : '/productos')
  }

  function go(slug: string) {
    setOpen(false)
    setQuery('')
    onNavigate?.()
    router.push(`/producto/${slug}`)
  }

  return (
    <div className={cn('relative w-full', className)}>
      <form onSubmit={submit} role="search">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            autoFocus={autoFocus}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              blurTimeout.current = setTimeout(() => setOpen(false), 150)
            }}
            placeholder="Buscar alimentos, juguetes, marcas..."
            aria-label="Buscar productos"
            className="h-12 w-full rounded-2xl border border-border bg-secondary/60 pl-12 pr-11 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-brand focus:bg-card focus:ring-2 focus:ring-brand/20"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </form>

      {open && suggestions.length > 0 && (
        <div
          className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-popover shadow-xl"
          onMouseDown={() => {
            if (blurTimeout.current) clearTimeout(blurTimeout.current)
          }}
        >
          <p className="px-4 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Sugerencias
          </p>
          <ul className="p-2">
            {suggestions.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => go(p.slug)}
                  className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-secondary"
                >
                  <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-secondary">
                    <Image
                      src={p.image || '/placeholder.svg'}
                      alt={p.name}
                      fill
                      sizes="44px"
                      className="object-contain p-1"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-popover-foreground">
                      {p.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">{p.brand}</span>
                  </span>
                  <span className="text-sm font-bold text-brand">{formatPrice(p.price)}</span>
                </button>
              </li>
            ))}
          </ul>
          <Link
            href={`/productos?q=${encodeURIComponent(query.trim())}`}
            onClick={() => {
              setOpen(false)
              onNavigate?.()
            }}
            className="block border-t border-border px-4 py-3 text-center text-sm font-semibold text-brand transition-colors hover:bg-secondary"
          >
            Ver todos los resultados
          </Link>
        </div>
      )}
    </div>
  )
}
