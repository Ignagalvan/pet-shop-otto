import Link from 'next/link'
import {
  MessageCircle,
  PawPrint,
  Search,
  ShoppingBag,
  UserRound,
  Users,
} from 'lucide-react'
import { formatPrice } from '@/lib/format'
import { requireStaff } from '@/lib/supabase/staff'

export const metadata = { title: 'Clientes' }

const PAGE_SIZE = 24

type AdminCustomer = {
  phone_key: string
  full_name: string
  phone: string
  email: string | null
  pet_names: string[]
  orders_count: number
  active_orders: number
  total_spent: number
  last_order_at: string | null
  total_count: number
}

const date = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'medium',
  timeZone: 'America/Argentina/Cordoba',
})

function customerPageHref(query: string, page: number) {
  const params = new URLSearchParams()
  if (query) params.set('q', query)
  if (page > 1) params.set('pagina', String(page))
  const suffix = params.toString()
  return `/admin/clientes${suffix ? `?${suffix}` : ''}`
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

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; pagina?: string }>
}) {
  const params = await searchParams
  const query = params.q?.trim() ?? ''
  const requestedPage = Math.max(Number(params.pagina) || 1, 1)
  const { supabase, profile } = await requireStaff()

  if (!profile) {
    return (
      <div className="m-6 rounded-2xl border border-destructive/25 bg-destructive/10 p-5 text-destructive">
        No tenés permiso para consultar clientes.
      </div>
    )
  }

  const { data, error } = await supabase.rpc('get_admin_customers', {
    p_search: query,
    p_limit: PAGE_SIZE,
    p_offset: (requestedPage - 1) * PAGE_SIZE,
  })
  const customers = (data ?? []) as AdminCustomer[]
  const total = Number(customers[0]?.total_count ?? 0)
  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1)
  const page = Math.min(requestedPage, totalPages)
  const pages = visiblePages(page, totalPages)

  return (
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
      <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brown">
        Relaciones
      </p>
      <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-extrabold">Clientes</h1>
          <p className="mt-1 text-muted-foreground">
            {total.toLocaleString('es-AR')}{' '}
            {total === 1 ? 'cliente encontrado' : 'clientes encontrados'}.
          </p>
        </div>
        <Link
          href="/admin/pedidos"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border bg-white px-4 text-sm font-bold text-primary shadow-sm"
        >
          <ShoppingBag className="size-4" />
          Ver pedidos
        </Link>
      </div>

      <form className="mt-6 flex gap-3 rounded-2xl border bg-white p-4 shadow-sm">
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Buscar por nombre, teléfono, correo o mascota…"
            className="h-11 w-full rounded-xl border bg-background pl-10 pr-4 outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
          />
        </label>
        <button className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-primary px-5 font-bold text-white">
          Buscar
        </button>
      </form>

      {error ? (
        <div className="mt-5 rounded-2xl border border-destructive/25 bg-destructive/10 p-5 text-destructive">
          No pudimos cargar los clientes: {error.message}
        </div>
      ) : customers.length === 0 ? (
        <section className="mt-5 rounded-3xl border bg-white p-10 text-center shadow-sm">
          <Users className="mx-auto size-11 text-primary" />
          <h2 className="mt-4 text-xl font-extrabold">
            {query ? 'No encontramos coincidencias' : 'Todavía no hay clientes'}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {query
              ? 'Probá con otro nombre, teléfono, correo o nombre de mascota.'
              : 'Los clientes se registrarán automáticamente cuando ingresen pedidos desde la tienda.'}
          </p>
        </section>
      ) : (
        <>
          <div className="mt-5 overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="hidden grid-cols-[minmax(230px,1.4fr)_minmax(180px,1fr)_110px_150px_140px_44px] gap-4 border-b bg-muted/55 px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-muted-foreground lg:grid">
              <span>Cliente</span>
              <span>Mascotas</span>
              <span>Pedidos</span>
              <span>Compras</span>
              <span>Última compra</span>
              <span />
            </div>

            <div className="grid gap-3 p-3 sm:grid-cols-2 lg:block lg:divide-y lg:p-0">
              {customers.map((customer) => (
                <article
                  key={customer.phone_key}
                  className="grid gap-4 rounded-2xl border p-4 transition hover:border-primary/25 hover:bg-primary/[0.025] lg:grid-cols-[minmax(230px,1.4fr)_minmax(180px,1fr)_110px_150px_140px_44px] lg:items-center lg:rounded-none lg:border-0 lg:px-5"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <UserRound className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-extrabold">{customer.full_name}</p>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {customer.phone}
                      </p>
                      {customer.email ? (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {customer.email}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {customer.pet_names.length ? (
                      customer.pet_names.slice(0, 3).map((pet) => (
                        <span
                          key={pet}
                          className="inline-flex items-center gap-1 rounded-full bg-brown/8 px-2.5 py-1 text-xs font-bold text-brown"
                        >
                          <PawPrint className="size-3" />
                          {pet}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">Sin datos</span>
                    )}
                  </div>

                  <div>
                    <p className="font-extrabold">
                      {Number(customer.orders_count).toLocaleString('es-AR')}
                    </p>
                    {Number(customer.active_orders) > 0 ? (
                      <p className="text-xs font-bold text-amber-700">
                        {customer.active_orders} en curso
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Sin pendientes</p>
                    )}
                  </div>

                  <p className="font-extrabold">
                    {formatPrice(Number(customer.total_spent))}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {customer.last_order_at
                      ? date.format(new Date(customer.last_order_at))
                      : 'Sin compras'}
                  </p>

                  <Link
                    href={`/admin/clientes/${customer.phone_key}`}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white lg:size-10 lg:px-0"
                    aria-label={`Ver ficha de ${customer.full_name}`}
                  >
                    <MessageCircle className="size-4 lg:hidden" />
                    <span className="lg:hidden">Ver cliente</span>
                    <UserRound className="hidden size-4 lg:block" />
                  </Link>
                </article>
              ))}
            </div>
          </div>

          {totalPages > 1 ? (
            <nav
              className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-3 shadow-sm"
              aria-label="Paginación de clientes"
            >
              <p className="text-sm text-muted-foreground">
                Página <strong className="text-foreground">{page}</strong> de{' '}
                <strong className="text-foreground">{totalPages}</strong>
              </p>
              <div className="flex items-center gap-1.5">
                <Link
                  href={customerPageHref(query, Math.max(page - 1, 1))}
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
                      href={customerPageHref(query, item)}
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
                  href={customerPageHref(query, Math.min(page + 1, totalPages))}
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
        </>
      )}
    </div>
  )
}
