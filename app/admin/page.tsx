import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CircleDollarSign,
  FileSpreadsheet,
  PackageCheck,
  PackageX,
} from 'lucide-react'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const metadata = { title: 'Panel de administración' }

type DashboardStats = {
  authorized: boolean
  fullName: string | null
  products: number
  published: number
  outOfStock: number
  lowStock: number
  inventoryUnits: number
  inventoryValue: number
  lastImport: null | {
    fileName: string
    totalRows: number
    newRows: number
    updatedRows: number
    reviewRows: number
    appliedAt: string
  }
}

const currency = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

export default async function AdminPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-3xl border bg-white p-7 shadow-sm">
          <Boxes className="size-10 text-primary" />
          <h1 className="mt-4 text-3xl font-extrabold">Base del panel lista</h1>
          <p className="mt-3 text-muted-foreground">
            Falta conectar las variables de Supabase.
          </p>
        </div>
      </div>
    )
  }

  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.rpc('get_admin_dashboard_stats')
  const stats = data as DashboardStats | null

  if (!stats?.authorized) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-3xl border bg-white p-7">
          Esta cuenta todavía no tiene permisos administrativos.
        </div>
      </div>
    )
  }

  const cards = [
    {
      label: 'Productos cargados',
      value: stats.products.toLocaleString('es-AR'),
      detail: `${stats.published} publicados`,
      icon: PackageCheck,
      color: 'text-primary bg-primary/10',
    },
    {
      label: 'Unidades en stock',
      value: stats.inventoryUnits.toLocaleString('es-AR'),
      detail: 'Suma de todas las variantes',
      icon: Boxes,
      color: 'text-success bg-success/10',
    },
    {
      label: 'Sin stock',
      value: stats.outOfStock.toLocaleString('es-AR'),
      detail: `${stats.lowStock} con stock bajo`,
      icon: PackageX,
      color: 'text-promo bg-promo/10',
    },
    {
      label: 'Valor del inventario',
      value: currency.format(stats.inventoryValue),
      detail: 'Calculado al costo',
      icon: CircleDollarSign,
      color: 'text-brown bg-brown/10',
    },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
      <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brown">
        Resumen del negocio
      </p>
      <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-extrabold">
            Hola, {stats.fullName || 'equipo Otto'}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Este es el estado actual del catálogo.
          </p>
        </div>
        <Link
          href="/admin/importar"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary/90"
        >
          <FileSpreadsheet className="size-4" />
          Importar Excel
        </Link>
      </div>

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <article key={card.label} className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className={`flex size-10 items-center justify-center rounded-xl ${card.color}`}>
                <Icon className="size-5" />
              </div>
              <p className="mt-4 text-sm font-bold text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-2xl font-extrabold">{card.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{card.detail}</p>
            </article>
          )
        })}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Link
          href="/admin/productos"
          className="group rounded-3xl border bg-white p-6 shadow-sm transition hover:border-primary/30 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <PackageCheck className="size-8 text-primary" />
              <h2 className="mt-5 text-xl font-extrabold">Administrar productos</h2>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Buscá, corregí precios y stock, completá información y decidí qué productos publicar.
              </p>
            </div>
            <ArrowRight className="size-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
          </div>
        </Link>

        <article className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-6 text-promo" />
            <h2 className="font-extrabold">Última importación</h2>
          </div>
          {stats.lastImport ? (
            <>
              <p className="mt-4 font-bold">{stats.lastImport.fileName}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {stats.lastImport.totalRows} filas · {stats.lastImport.newRows} nuevos ·{' '}
                {stats.lastImport.reviewRows} observaciones
              </p>
            </>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Todavía no se aplicó ninguna importación.
            </p>
          )}
        </article>
      </section>
    </div>
  )
}
