'use client'

import { useMemo, useState } from 'react'
import { Filter, PawPrint, SearchX, SlidersHorizontal, X } from 'lucide-react'
import { ProductCard } from './product-card'
import type { CatalogOption } from '@/lib/catalog'
import type { Product } from '@/lib/types'

type InitialFilters = {
  q?: string
  mascota?: string
  categoria?: string
  marca?: string
  oferta?: boolean
}

export function CatalogClient({
  products,
  initial,
  options,
}: {
  products: Product[]
  initial: InitialFilters
  options: {
    brands: string[]
    categories: CatalogOption[]
    petTypes: CatalogOption[]
  }
}) {
  const { brands, categories, petTypes } = options
  const [pet, setPet] = useState(initial.mascota ?? '')
  const [category, setCategory] = useState(initial.categoria ?? '')
  const [brand, setBrand] = useState(initial.marca ?? '')
  const [onlyOffers, setOnlyOffers] = useState(initial.oferta ?? false)
  const [inStock, setInStock] = useState(false)
  const [sort, setSort] = useState('featured')
  const [mobileFilters, setMobileFilters] = useState(false)
  const query = (initial.q ?? '').trim().toLowerCase()
  const selectedPet = petTypes.find((item) => item.slug === pet)
  const selectedCategory = categories.find((item) => item.slug === category)

  const filtered = useMemo(() => {
    const result = products.filter((product) => {
      const searchable = `${product.name} ${product.brand} ${product.category} ${product.description}`.toLowerCase()
      if (query && !searchable.includes(query)) return false
      if (pet && !product.petTypes.includes(pet as never)) return false
      if (category && product.category !== category) return false
      if (brand && product.brand !== brand) return false
      if (onlyOffers && !product.tags.includes('oferta')) return false
      if (inStock && product.stock === 'agotado') return false
      return true
    })

    return [...result].sort((a, b) => {
      if (sort === 'low') return a.price - b.price
      if (sort === 'high') return b.price - a.price
      if (sort === 'rating') return b.rating - a.rating
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured))
    })
  }, [brand, category, inStock, onlyOffers, pet, products, query, sort])

  const hasFilters = Boolean(pet || category || brand || onlyOffers || inStock)
  const reset = () => {
    setPet('')
    setCategory('')
    setBrand('')
    setOnlyOffers(false)
    setInStock(false)
  }

  const filters = (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <SlidersHorizontal className="size-5 text-brand" /> Filtrar
        </h2>
        {hasFilters && (
          <button onClick={reset} className="text-xs font-bold text-brand hover:underline">
            Limpiar
          </button>
        )}
      </div>
      <FilterGroup label="¿Para quién comprás?" value={pet} onChange={setPet} options={petTypes} />
      <FilterGroup label="¿Qué necesita?" value={category} onChange={setCategory} options={categories} />
      <div>
        <label htmlFor="brand" className="mb-3 block text-sm font-extrabold text-foreground">Marca</label>
        <select id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-brand">
          <option value="">Todas las marcas</option>
          {brands.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <label className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold">
        Solo productos en oferta
        <input type="checkbox" checked={onlyOffers} onChange={(e) => setOnlyOffers(e.target.checked)} className="size-4 accent-brand" />
      </label>
      <label className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold">
        Ocultar agotados
        <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} className="size-4 accent-brand" />
      </label>
    </div>
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
      {selectedPet ? (
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-brand/15 bg-brand-light/65 px-4 py-3 text-sm">
          <span className="flex size-8 items-center justify-center rounded-full bg-brand text-white">
            <PawPrint className="size-4" aria-hidden="true" />
          </span>
          <span className="font-semibold text-muted-foreground">Estás buscando para</span>
          <span className="font-extrabold text-foreground">{selectedPet.label}</span>
          {selectedCategory ? (
            <>
              <span className="text-brand/45" aria-hidden="true">•</span>
              <span className="font-extrabold text-brand">{selectedCategory.label}</span>
            </>
          ) : null}
          <button
            type="button"
            onClick={() => setPet('')}
            className="ml-auto rounded-lg px-2.5 py-1.5 text-xs font-extrabold text-brand transition-colors hover:bg-card"
          >
            Cambiar mascota
          </button>
        </div>
      ) : null}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">
            {query
              ? `Resultados para “${initial.q}”`
              : selectedPet
                ? `Opciones pensadas para ${selectedPet.label.toLocaleLowerCase('es')}`
                : 'Todo para cuidar a tu mascota'}
          </p>
          <p className="mt-1 text-sm font-bold text-foreground">
            {filtered.length} {filtered.length === 1 ? 'producto' : 'productos'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setMobileFilters(true)} className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-bold lg:hidden">
            <Filter className="size-4" /> Filtros
          </button>
          <select aria-label="Ordenar productos" value={sort} onChange={(e) => setSort(e.target.value)} className="h-11 rounded-xl border border-border bg-card px-3 text-sm font-semibold outline-none focus:border-brand">
            <option value="featured">Destacados</option>
            <option value="low">Menor precio</option>
            <option value="high">Mayor precio</option>
            <option value="rating">Mejor valorados</option>
          </select>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden rounded-2xl border border-border bg-card p-5 shadow-sm lg:block">
          {filters}
        </aside>
        {filtered.length ? (
          <div className="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((product, index) => (
              <div
                key={product.id}
                id={index === 0 ? 'primer-producto' : undefined}
                className={index === 0 ? 'scroll-mt-36' : undefined}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-96 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card p-8 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-secondary text-brand"><SearchX className="size-7" /></span>
            <h2 className="mt-4 text-xl font-bold">No encontramos productos</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">Probá cambiando los filtros o buscá otro producto.</p>
            <button onClick={reset} className="mt-5 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white">Ver todos</button>
          </div>
        )}
      </div>

      {mobileFilters && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <button aria-label="Cerrar filtros" className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setMobileFilters(false)} />
          <aside className="absolute inset-y-0 right-0 w-[88%] max-w-sm overflow-y-auto bg-card p-6 shadow-2xl">
            <button onClick={() => setMobileFilters(false)} className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-secondary" aria-label="Cerrar"><X className="size-5" /></button>
            {filters}
            <button onClick={() => setMobileFilters(false)} className="mt-8 h-12 w-full rounded-xl bg-brand text-sm font-bold text-white">Ver {filtered.length} productos</button>
          </aside>
        </div>
      )}
    </div>
  )
}

function FilterGroup({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { slug: string; label: string }[]
}) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-extrabold text-foreground">{label}</legend>
      <div className="space-y-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input type="radio" name={label} checked={!value} onChange={() => onChange('')} className="accent-brand" /> Todos
        </label>
        {options.map((item) => (
          <label key={item.slug} className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <input type="radio" name={label} checked={value === item.slug} onChange={() => onChange(item.slug)} className="accent-brand" />
            {item.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
