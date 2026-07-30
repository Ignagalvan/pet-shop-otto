import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  FileSpreadsheet,
  PackageCheck,
  PackageX,
  ReceiptText,
  ShoppingBag,
  TrendingUp,
  UserPlus,
  UsersRound,
} from 'lucide-react'
import {
  ActivityFeed,
  type ActivityItem,
} from '@/components/admin/activity-feed'
import {
  FulfillmentChart,
  SalesBarChart,
  TopProductsChart,
  type SalesDay,
  type TopProduct,
} from '@/components/admin/dashboard-charts'
import { formatPrice } from '@/lib/format'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const metadata = { title: 'Panel de administración' }

type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled'

type RecentOrder = {
  id: string
  orderNumber: number
  status: OrderStatus
  total: number
  createdAt: string
  customerName: string
}

type DashboardStats = {
  authorized: boolean
  fullName: string | null
  products: number
  published: number
  outOfStock: number
  lowStock: number
  inventoryUnits: number
  inventoryValue: number
  todaySales: number
  weekSales: number
  monthSales: number
  todayOrders: number
  activeOrders: number
  averageTicket: number
  newCustomersMonth: number
  repeatCustomers: number
  salesByDay: SalesDay[]
  topProducts: TopProduct[]
  recentOrders: RecentOrder[]
  fulfillment: {
    delivery: number
    pickup: number
  }
  lastImport: null | {
    fileName: string
    totalRows: number
    newRows: number
    updatedRows: number
    reviewRows: number
    appliedAt: string
  }
}

const date = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'full',
  timeZone: 'America/Argentina/Cordoba',
})

const shortDateTime = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Argentina/Cordoba',
})

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Nuevo',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready: 'Listo',
  completed: 'Entregado',
  cancelled: 'Cancelado',
}

const statusStyles: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-primary/10 text-primary',
  preparing: 'bg-brown/10 text-brown',
  ready: 'bg-success/10 text-success',
  completed: 'bg-success text-white',
  cancelled: 'bg-destructive/10 text-destructive',
}

function displayOrderNumber(order: RecentOrder) {
  const year = new Date(order.createdAt).getFullYear()
  return `OTTO-${year}-${String(order.orderNumber).padStart(6, '0')}`
}

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
  const [statsResult, activityResult] = await Promise.all([
    supabase.rpc('get_admin_dashboard_stats'),
    supabase.rpc('get_admin_activity', {
      p_category: 'all',
      p_search: '',
      p_limit: 5,
      p_offset: 0,
    }),
  ])
  const stats = statsResult.data as DashboardStats | null
  const recentActivity = (activityResult.data ?? []) as ActivityItem[]
  const error = statsResult.error ?? activityResult.error

  if (error) {
    return (
      <div className="m-6 rounded-2xl border border-destructive/25 bg-destructive/10 p-5 text-destructive">
        No pudimos cargar el resumen: {error.message}
      </div>
    )
  }

  if (!stats?.authorized) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-3xl border bg-white p-7">
          Esta cuenta todavía no tiene permisos administrativos.
        </div>
      </div>
    )
  }

  const businessCards = [
    {
      label: 'Ventas generadas hoy',
      value: formatPrice(Number(stats.todaySales)),
      detail: `${Number(stats.todayOrders)} ${
        Number(stats.todayOrders) === 1 ? 'pedido ingresado' : 'pedidos ingresados'
      }`,
      icon: CircleDollarSign,
      color: 'text-success bg-success/10',
    },
    {
      label: 'Ventas de la semana',
      value: formatPrice(Number(stats.weekSales)),
      detail: `${formatPrice(Number(stats.monthSales))} este mes`,
      icon: TrendingUp,
      color: 'text-primary bg-primary/10',
    },
    {
      label: 'Pedidos en curso',
      value: Number(stats.activeOrders).toLocaleString('es-AR'),
      detail: 'Nuevos, preparando o listos',
      icon: Clock3,
      color: 'text-amber-700 bg-amber-100',
    },
    {
      label: 'Ticket promedio',
      value: formatPrice(Number(stats.averageTicket)),
      detail: 'Promedio del mes, sin cancelados',
      icon: ReceiptText,
      color: 'text-brown bg-brown/10',
    },
  ]

  const operationCards = [
    {
      label: 'Valor del inventario',
      value: formatPrice(Number(stats.inventoryValue)),
      detail: `${Number(stats.inventoryUnits).toLocaleString('es-AR')} unidades al costo`,
      icon: Boxes,
      href: '/admin/productos',
    },
    {
      label: 'Productos publicados',
      value: Number(stats.published).toLocaleString('es-AR'),
      detail: `${Number(stats.products).toLocaleString('es-AR')} cargados en total`,
      icon: PackageCheck,
      href: '/admin/productos?estado=publicados',
    },
    {
      label: 'Clientes nuevos',
      value: Number(stats.newCustomersMonth).toLocaleString('es-AR'),
      detail: `${Number(stats.repeatCustomers).toLocaleString('es-AR')} volvieron a comprar`,
      icon: UserPlus,
      href: '/admin/clientes',
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
          <p className="mt-1 first-letter:uppercase text-muted-foreground">
            {date.format(new Date())}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/pedidos"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border bg-white px-4 text-sm font-bold text-primary shadow-sm"
          >
            <ShoppingBag className="size-4" />
            Gestionar pedidos
          </Link>
          <Link
            href="/admin/importar"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white"
          >
            <FileSpreadsheet className="size-4" />
            Importar Excel
          </Link>
        </div>
      </div>

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {businessCards.map((card) => {
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

      {(Number(stats.outOfStock) > 0 || Number(stats.lowStock) > 0) ? (
        <section className="mt-5 grid gap-3 sm:grid-cols-2">
          {Number(stats.outOfStock) > 0 ? (
            <Link
              href="/admin/productos?estado=sin-stock"
              className="flex items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/8 p-4 text-destructive transition hover:border-destructive/35"
            >
              <PackageX className="size-6 shrink-0" />
              <div>
                <p className="font-extrabold">
                  {stats.outOfStock} productos sin stock
                </p>
                <p className="text-xs opacity-80">Revisalos antes de la próxima venta.</p>
              </div>
              <ArrowRight className="ml-auto size-4 shrink-0" />
            </Link>
          ) : null}
          {Number(stats.lowStock) > 0 ? (
            <Link
              href="/admin/productos?estado=stock-bajo"
              className="flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900 transition hover:border-amber-400"
            >
              <AlertTriangle className="size-6 shrink-0" />
              <div>
                <p className="font-extrabold">
                  {stats.lowStock} productos con pocas unidades
                </p>
                <p className="text-xs opacity-80">Conviene preparar la reposición.</p>
              </div>
              <ArrowRight className="ml-auto size-4 shrink-0" />
            </Link>
          ) : null}
        </section>
      ) : null}

      <section className="mt-5 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <SalesBarChart data={stats.salesByDay ?? []} />
        <TopProductsChart products={stats.topProducts ?? []} />
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <article className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b p-5">
            <div>
              <h2 className="text-lg font-extrabold">Últimos pedidos</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Lo más reciente que requiere seguimiento.
              </p>
            </div>
            <Link
              href="/admin/pedidos"
              className="text-sm font-extrabold text-primary"
            >
              Ver todos
            </Link>
          </div>
          {stats.recentOrders?.length ? (
            <div className="divide-y">
              {stats.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:px-5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-extrabold">{order.customerName}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {displayOrderNumber(order)} ·{' '}
                      {shortDateTime.format(new Date(order.createdAt))}
                    </p>
                  </div>
                  <span
                    className={`w-fit rounded-full px-2.5 py-1 text-xs font-extrabold ${statusStyles[order.status]}`}
                  >
                    {statusLabels[order.status]}
                  </span>
                  <p className="font-extrabold">{formatPrice(Number(order.total))}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Los pedidos nuevos aparecerán acá.
            </div>
          )}
        </article>

        <FulfillmentChart
          delivery={Number(stats.fulfillment?.delivery ?? 0)}
          pickup={Number(stats.fulfillment?.pickup ?? 0)}
        />
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-3">
        {operationCards.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.label}
              href={card.href}
              className="group rounded-2xl border bg-white p-5 shadow-sm transition hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/8 text-primary">
                  <Icon className="size-5" />
                </div>
                <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
              </div>
              <p className="mt-4 text-sm font-bold text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-xl font-extrabold">{card.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{card.detail}</p>
            </Link>
          )
        })}
      </section>

      <section className="mt-5 overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b p-5">
          <div>
            <h2 className="text-lg font-extrabold">Actividad reciente</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Los últimos movimientos importantes del negocio.
            </p>
          </div>
          <Link
            href="/admin/historial"
            className="shrink-0 text-sm font-extrabold text-primary"
          >
            Ver historial
          </Link>
        </div>
        {recentActivity.length ? (
          <ActivityFeed activities={recentActivity} compact />
        ) : (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Los próximos cambios aparecerán acá.
          </p>
        )}
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Link
          href="/admin/clientes"
          className="group rounded-2xl border bg-white p-5 shadow-sm transition hover:border-primary/30"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <UsersRound className="size-7 text-primary" />
              <h2 className="mt-4 text-lg font-extrabold">Conocer a tus clientes</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Consultá mascotas, compras anteriores y notas internas.
              </p>
            </div>
            <ArrowRight className="size-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
          </div>
        </Link>

        <article className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <CalendarDays className="size-6 text-brown" />
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
