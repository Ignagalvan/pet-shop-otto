import Link from 'next/link'
import {
  CalendarClock,
  MapPin,
  PackageCheck,
  Phone,
  ShoppingBag,
  Store,
  Truck,
  UserRound,
} from 'lucide-react'
import { OrderStatusForm } from '@/components/admin/order-status-form'
import { formatPrice } from '@/lib/format'
import { requireStaff } from '@/lib/supabase/staff'
import { getPublicStoreSettings } from '@/lib/store-settings-server'

export const metadata = { title: 'Administrar pedidos' }

type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled'

type AdminOrder = {
  id: string
  order_number: number
  status: OrderStatus
  payment_method: string | null
  payment_status: string
  fulfillment_method: string | null
  subtotal: number
  shipping_amount: number
  total: number
  customer_snapshot: {
    name?: string
    phone?: string
    email?: string
    pet?: string
    delivery?: {
      address?: string
      city?: string
      postalCode?: string
      notes?: string
    }
  }
  created_at: string
  order_items: Array<{
    id: number
    product_name: string
    presentation: string | null
    unit_price: number
    quantity: number
    subtotal: number
  }>
}

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

const paymentLabels: Record<string, string> = {
  link: 'Link de pago',
  transferencia: 'Transferencia',
  entrega: 'Pago al recibir',
  whatsapp: 'Coordinación por WhatsApp',
}

const dateTime = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Argentina/Cordoba',
})

function displayOrderNumber(order: AdminOrder) {
  const year = new Date(order.created_at).getFullYear()
  return `OTTO-${year}-${String(order.order_number).padStart(6, '0')}`
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>
}) {
  const { estado = 'todos' } = await searchParams
  const { supabase, profile } = await requireStaff()
  const settings = await getPublicStoreSettings()

  if (!profile) {
    return (
      <div className="m-6 rounded-2xl border border-destructive/25 bg-destructive/10 p-5 text-destructive">
        No tenés permiso para consultar pedidos.
      </div>
    )
  }

  let query = supabase
    .from('orders')
    .select(`
      id,
      order_number,
      status,
      payment_method,
      payment_status,
      fulfillment_method,
      subtotal,
      shipping_amount,
      total,
      customer_snapshot,
      created_at,
      order_items (
        id,
        product_name,
        presentation,
        unit_price,
        quantity,
        subtotal
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (estado !== 'todos' && estado in statusLabels) {
    query = query.eq('status', estado)
  }

  const { data, error } = await query
  const orders = (data ?? []) as unknown as AdminOrder[]

  return (
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
      <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brown">
        Ventas
      </p>
      <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-extrabold">Pedidos</h1>
          <p className="mt-1 text-muted-foreground">
            {orders.length} {orders.length === 1 ? 'pedido encontrado' : 'pedidos encontrados'}.
          </p>
        </div>
        <Link
          href="/productos"
          target="_blank"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border bg-white px-4 text-sm font-bold text-primary"
        >
          <ShoppingBag className="size-4" />
          Ver tienda
        </Link>
      </div>

      <form className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border bg-white p-4 shadow-sm">
        <label htmlFor="estado" className="text-sm font-extrabold">
          Mostrar
        </label>
        <select
          id="estado"
          name="estado"
          defaultValue={estado}
          className="h-11 min-w-52 rounded-xl border bg-background px-3 outline-none focus:border-primary"
        >
          <option value="todos">Todos los pedidos</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <button className="h-11 rounded-xl bg-primary px-5 text-sm font-extrabold text-white">
          Filtrar
        </button>
      </form>

      {error ? (
        <div className="mt-5 rounded-2xl border border-destructive/25 bg-destructive/10 p-5 text-destructive">
          No pudimos cargar los pedidos: {error.message}
        </div>
      ) : orders.length === 0 ? (
        <section className="mt-5 rounded-3xl border bg-white p-10 text-center shadow-sm">
          <PackageCheck className="mx-auto size-10 text-primary" />
          <h2 className="mt-4 text-xl font-extrabold">Todavía no hay pedidos</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Las compras confirmadas desde la tienda aparecerán acá automáticamente.
          </p>
        </section>
      ) : (
        <div className="mt-5 space-y-4">
          {orders.map((order) => {
            const customer = order.customer_snapshot ?? {}
            const delivery = customer.delivery ?? {}
            const isDelivery = order.fulfillment_method === 'envio'

            return (
              <article key={order.id} className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b bg-muted/35 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-extrabold">{displayOrderNumber(order)}</h2>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${statusStyles[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarClock className="size-3.5" />
                      {dateTime.format(new Date(order.created_at))}
                    </p>
                  </div>
                  <OrderStatusForm orderId={order.id} status={order.status} />
                </div>

                <div className="grid gap-6 p-4 sm:p-5 lg:grid-cols-[1fr_1.2fr_0.8fr]">
                  <section>
                    <h3 className="flex items-center gap-2 text-sm font-extrabold">
                      <UserRound className="size-4 text-primary" />
                      Cliente
                    </h3>
                    <p className="mt-3 font-bold">{customer.name || 'Sin nombre'}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Phone className="size-3.5" />
                      {customer.phone || 'Sin teléfono'}
                    </p>
                    {customer.email && <p className="mt-1 break-all text-sm text-muted-foreground">{customer.email}</p>}
                    {customer.pet && <p className="mt-2 text-sm"><strong>Mascota:</strong> {customer.pet}</p>}
                  </section>

                  <section>
                    <h3 className="flex items-center gap-2 text-sm font-extrabold">
                      {isDelivery ? <Truck className="size-4 text-primary" /> : <Store className="size-4 text-primary" />}
                      {isDelivery ? 'Envío a domicilio' : 'Retiro en el local'}
                    </h3>
                    {isDelivery ? (
                      <div className="mt-3 text-sm leading-6 text-muted-foreground">
                        <p className="flex items-start gap-1.5">
                          <MapPin className="mt-1 size-3.5 shrink-0" />
                          <span>{delivery.address}, {delivery.city} {delivery.postalCode}</span>
                        </p>
                        {delivery.notes && <p className="mt-1"><strong>Indicaciones:</strong> {delivery.notes}</p>}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">{settings.address}</p>
                    )}
                    <p className="mt-3 text-sm">
                      <strong>Pago:</strong> {paymentLabels[order.payment_method ?? ''] ?? order.payment_method ?? 'Sin definir'}
                    </p>
                  </section>

                  <section className="rounded-xl bg-background p-4">
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">Productos</span>
                      <strong>{formatPrice(order.subtotal)}</strong>
                    </div>
                    <div className="mt-2 flex justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">Entrega</span>
                      <strong>{order.shipping_amount ? formatPrice(order.shipping_amount) : 'Gratis'}</strong>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between gap-3 border-t pt-3">
                      <span className="font-bold">Total</span>
                      <strong className="text-xl">{formatPrice(order.total)}</strong>
                    </div>
                  </section>
                </div>

                <details className="border-t">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-extrabold text-primary sm:px-5">
                    Ver {order.order_items.length} {order.order_items.length === 1 ? 'producto' : 'productos'}
                  </summary>
                  <ul className="divide-y border-t bg-background/45">
                    {order.order_items.map((item) => (
                      <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm sm:px-5">
                        <span>
                          <strong>{Number(item.quantity).toLocaleString('es-AR')}× {item.product_name}</strong>
                          {item.presentation && <span className="ml-2 text-muted-foreground">({item.presentation})</span>}
                        </span>
                        <span className="font-bold">{formatPrice(item.subtotal)}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
