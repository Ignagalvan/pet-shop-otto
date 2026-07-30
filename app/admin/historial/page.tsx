import Link from 'next/link'
import { History, PawPrint, Search } from 'lucide-react'
import {
  ActivityFeed,
  type ActivityItem,
} from '@/components/admin/activity-feed'
import { requireStaff } from '@/lib/supabase/staff'

export const metadata = { title: 'Historial de actividad' }

const PAGE_SIZE = 30

const categories = [
  { value: 'all', label: 'Toda la actividad' },
  { value: 'orders', label: 'Pedidos' },
  { value: 'catalog', label: 'Catálogo y precios' },
  { value: 'stock', label: 'Stock' },
  { value: 'imports', label: 'Importaciones' },
  { value: 'settings', label: 'Configuración' },
] as const

type HistoryCategory = (typeof categories)[number]['value']

function historyHref(category: HistoryCategory, query: string, page: number) {
  const params = new URLSearchParams()
  if (category !== 'all') params.set('tipo', category)
  if (query) params.set('q', query)
  if (page > 1) params.set('pagina', String(page))
  const suffix = params.toString()
  return `/admin/historial${suffix ? `?${suffix}` : ''}`
}

function visiblePages(currentPage: number, totalPages: number) {
  const pages = new Set([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ])
  return [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b)
}

export default async function AdminHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; q?: string; pagina?: string }>
}) {
  const params = await searchParams
  const validCategories = new Set<string>(categories.map((item) => item.value))
  const requestedCategory = params.tipo ?? 'all'
  const category: HistoryCategory = validCategories.has(requestedCategory)
    ? (requestedCategory as HistoryCategory)
    : 'all'
  const query = params.q?.trim() ?? ''
  const requestedPage = Math.max(Number(params.pagina) || 1, 1)
  const { supabase, profile } = await requireStaff()

  if (!profile) {
    return (
      <div className="m-6 rounded-2xl border border-destructive/25 bg-destructive/10 p-5 text-destructive">
        No tenés permiso para consultar el historial.
      </div>
    )
  }

  const { data, error } = await supabase.rpc('get_admin_activity', {
    p_category: category,
    p_search: query,
    p_limit: PAGE_SIZE,
    p_offset: (requestedPage - 1) * PAGE_SIZE,
  })
  const activities = (data ?? []) as ActivityItem[]
  const total = Number(activities[0]?.total_count ?? 0)
  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1)
  const page = Math.min(requestedPage, totalPages)
  const pages = visiblePages(page, totalPages)

  return (
    <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
      <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brown">
        Control del negocio
      </p>
      <div className="mt-2">
        <h1 className="text-3xl font-extrabold">Historial</h1>
        <p className="mt-1 text-muted-foreground">
          Revisá qué cambió, cuándo ocurrió y quién realizó cada acción.
        </p>
      </div>

      <form className="mt-6 grid gap-3 rounded-2xl border bg-white p-4 shadow-sm md:grid-cols-[1fr_220px_auto]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Buscar actividad, producto o usuario…"
            className="h-11 w-full rounded-xl border bg-background pl-10 pr-4 outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
          />
        </label>
        <select
          name="tipo"
          defaultValue={category}
          className="h-11 rounded-xl border bg-background px-3 outline-none focus:border-primary"
        >
          {categories.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 font-bold text-white">
          <History className="size-4" />
          Filtrar
        </button>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {total.toLocaleString('es-AR')}{' '}
          {total === 1 ? 'movimiento encontrado' : 'movimientos encontrados'}
        </p>
        {category !== 'all' || query ? (
          <Link
            href="/admin/historial"
            className="text-sm font-extrabold text-primary"
          >
            Limpiar filtros
          </Link>
        ) : null}
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-destructive/25 bg-destructive/10 p-5 text-destructive">
          No pudimos cargar el historial: {error.message}
        </div>
      ) : activities.length ? (
        <div className="relative mt-4">
          <ActivityFeed activities={activities} />
        </div>
      ) : (
        <section className="mt-5 rounded-3xl border bg-white p-10 text-center shadow-sm">
          <History className="mx-auto size-10 text-primary" />
          <h2 className="mt-4 text-xl font-extrabold">
            No encontramos movimientos
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Probá con otro filtro o término de búsqueda.
          </p>
        </section>
      )}

      {totalPages > 1 ? (
        <nav
          className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-3 shadow-sm"
          aria-label="Paginación del historial"
        >
          <p className="text-sm text-muted-foreground">
            Página <strong className="text-foreground">{page}</strong> de{' '}
            <strong className="text-foreground">{totalPages}</strong>
          </p>
          <div className="flex items-center gap-1.5">
            <Link
              href={historyHref(category, query, Math.max(page - 1, 1))}
              aria-disabled={page === 1}
              className={`inline-flex size-10 items-center justify-center rounded-xl border text-primary ${
                page === 1 ? 'pointer-events-none opacity-35' : ''
              }`}
              aria-label="Página anterior"
            >
              <PawPrint className="size-4 -rotate-45" />
            </Link>
            {pages.map((item, index) => (
              <span key={item} className="flex items-center gap-1.5">
                {index > 0 && item - pages[index - 1] > 1 ? (
                  <span className="px-1 text-muted-foreground">…</span>
                ) : null}
                <Link
                  href={historyHref(category, query, item)}
                  aria-current={item === page ? 'page' : undefined}
                  className={`inline-flex size-10 items-center justify-center rounded-xl border text-sm font-extrabold ${
                    item === page
                      ? 'border-primary bg-primary text-white'
                      : 'bg-white text-primary'
                  }`}
                >
                  {item}
                </Link>
              </span>
            ))}
            <Link
              href={historyHref(category, query, Math.min(page + 1, totalPages))}
              aria-disabled={page === totalPages}
              className={`inline-flex size-10 items-center justify-center rounded-xl border text-primary ${
                page === totalPages ? 'pointer-events-none opacity-35' : ''
              }`}
              aria-label="Página siguiente"
            >
              <PawPrint className="size-4 rotate-[135deg]" />
            </Link>
          </div>
        </nav>
      ) : null}
    </div>
  )
}
