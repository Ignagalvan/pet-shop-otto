import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  CalendarClock,
  Mail,
  MapPin,
  MessageCircle,
  PawPrint,
  Phone,
  ShoppingBag,
  Store,
  Truck,
  UserRound,
} from 'lucide-react'
import { CustomerNoteForm } from '@/components/admin/customer-note-form'
import { formatPrice } from '@/lib/format'
import { requireStaff } from '@/lib/supabase/staff'
import { waLink } from '@/lib/whatsapp'

type CustomerDetail = {
  customer: {
    phone_key: string
    full_name: string
    phone: string
    email: string | null
    pet_names: string[]
    orders_count: number
    active_orders: number
    total_spent: number
    last_order_at: string | null
  }
  notes: string
  orders: Array<{
    id: string
    orderNumber: number
    status: OrderStatus
    paymentMethod: string | null
    paymentStatus: string
    fulfillmentMethod: string | null
    subtotal: number
    shippingAmount: number
    total: number
    notes: string | null
    createdAt: string
    customerSnapshot: {
      delivery?: {
        address?: string
        city?: string
        postalCode?: string
        notes?: string
      }
    }
    items: Array<{
      id: number
      productName: string
      presentation: string | null
      unitPrice: number
      quantity: number
      subtotal: number
    }>
  }>
}

type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled'

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
  local: 'Pago en el local',
  transferencia: 'Transferencia',
  entrega: 'Pago al recibir',
}

const paymentStatusLabels: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  cancelled: 'Pago cancelado',
}

const dateTime = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Argentina/Cordoba',
})

function displayOrderNumber(orderNumber: number, createdAt: string) {
  const year = new Date(createdAt).getFullYear()
  return `OTTO-${year}-${String(orderNumber).padStart(6, '0')}`
}

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ phone: string }>
}) {
  const { phone } = await params
  if (!/^[0-9]{6,20}$/.test(phone)) notFound()

  const { supabase, profile } = await requireStaff()
  if (!profile) {
    return (
      <div className="m-6 rounded-2xl border border-destructive/25 bg-destructive/10 p-5 text-destructive">
        No tenés permiso para consultar clientes.
      </div>
    )
  }

  const { data, error } = await supabase.rpc('get_admin_customer_detail', {
    p_phone_key: phone,
  })
  const detail = data as CustomerDetail | null

  if (error) {
    return (
      <div className="m-6 rounded-2xl border border-destructive/25 bg-destructive/10 p-5 text-destructive">
        No pudimos cargar la ficha del cliente: {error.message}
      </div>
    )
  }

  if (!detail) notFound()

  const customer = detail.customer
  const whatsappHref = waLink(
    `Hola ${customer.full_name}, te escribimos de Pet Shop Otto.`,
    customer.phone,
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
      <Link
        href="/admin/clientes"
        className="inline-flex items-center gap-2 text-sm font-bold text-primary"
      >
        <ArrowLeft className="size-4" />
        Volver a clientes
      </Link>

      <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-sm">
            <UserRound className="size-7" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brown">
              Ficha del cliente
            </p>
            <h1 className="mt-1 break-words text-3xl font-extrabold">
              {customer.full_name}
            </h1>
          </div>
        </div>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-success px-5 text-sm font-extrabold text-white shadow-sm"
        >
          <MessageCircle className="size-5" />
          Escribir por WhatsApp
        </a>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-extrabold">Datos de contacto</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 size-5 text-primary" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Teléfono
                </p>
                <p className="mt-1 font-bold">{customer.phone}</p>
              </div>
            </div>
            <div className="flex min-w-0 items-start gap-3">
              <Mail className="mt-0.5 size-5 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Correo
                </p>
                <p className="mt-1 break-all font-bold">
                  {customer.email || 'No informado'}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-5 border-t pt-4">
            <p className="flex items-center gap-2 text-sm font-extrabold">
              <PawPrint className="size-4 text-brown" />
              Mascotas
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {customer.pet_names.length ? (
                customer.pet_names.map((pet) => (
                  <span
                    key={pet}
                    className="rounded-full bg-brown/8 px-3 py-1.5 text-sm font-bold text-brown"
                  >
                    {pet}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">
                  No se registró ninguna mascota todavía.
                </span>
              )}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 rounded-2xl border bg-white p-4 shadow-sm">
          <div className="rounded-xl bg-primary/8 p-4">
            <ShoppingBag className="size-5 text-primary" />
            <p className="mt-3 text-2xl font-extrabold">
              {Number(customer.orders_count).toLocaleString('es-AR')}
            </p>
            <p className="text-xs text-muted-foreground">Pedidos totales</p>
          </div>
          <div className="rounded-xl bg-success/8 p-4">
            <span className="text-lg font-extrabold text-success">$</span>
            <p className="mt-3 text-xl font-extrabold">
              {formatPrice(Number(customer.total_spent))}
            </p>
            <p className="text-xs text-muted-foreground">Compras acumuladas</p>
          </div>
          <div className="col-span-2 rounded-xl bg-background p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Última compra
            </p>
            <p className="mt-1 font-extrabold">
              {customer.last_order_at
                ? dateTime.format(new Date(customer.last_order_at))
                : 'Todavía no realizó compras'}
            </p>
          </div>
        </section>
      </div>

      <div className="mt-4">
        <CustomerNoteForm
          phoneKey={customer.phone_key}
          notes={detail.notes}
        />
      </div>

      <section className="mt-7">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brown">
            Historial
          </p>
          <h2 className="mt-1 text-2xl font-extrabold">Compras del cliente</h2>
        </div>

        {detail.orders.length ? (
          <div className="mt-4 space-y-4">
            {detail.orders.map((order) => {
              const delivery = order.customerSnapshot?.delivery ?? {}
              const isDelivery = order.fulfillmentMethod === 'envio'

              return (
                <article
                  key={order.id}
                  className="overflow-hidden rounded-2xl border bg-white shadow-sm"
                >
                  <div className="flex flex-col gap-3 border-b bg-muted/35 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-extrabold">
                          {displayOrderNumber(order.orderNumber, order.createdAt)}
                        </h3>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${statusStyles[order.status]}`}
                        >
                          {statusLabels[order.status]}
                        </span>
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarClock className="size-3.5" />
                        {dateTime.format(new Date(order.createdAt))}
                      </p>
                    </div>
                    <p className="text-xl font-extrabold">
                      {formatPrice(Number(order.total))}
                    </p>
                  </div>

                  <div className="grid gap-5 p-4 md:grid-cols-[1fr_1fr]">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-extrabold">
                        {isDelivery ? (
                          <Truck className="size-4 text-primary" />
                        ) : (
                          <Store className="size-4 text-primary" />
                        )}
                        {isDelivery ? 'Envío a domicilio' : 'Retiro en el local'}
                      </p>
                      {isDelivery ? (
                        <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="mt-0.5 size-4 shrink-0" />
                          <span>
                            {[delivery.address, delivery.city, delivery.postalCode]
                              .filter(Boolean)
                              .join(', ')}
                          </span>
                        </p>
                      ) : null}
                      <p className="mt-2 text-sm">
                        <strong>Forma de pago:</strong>{' '}
                        {paymentLabels[order.paymentMethod ?? ''] ??
                          order.paymentMethod ??
                          'Sin definir'}
                      </p>
                      <p className="mt-1 text-sm">
                        <strong>Estado del pago:</strong>{' '}
                        {paymentStatusLabels[order.paymentStatus] ??
                          order.paymentStatus}
                      </p>
                    </div>
                    <div className="rounded-xl bg-background p-3">
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">Productos</span>
                        <strong>{formatPrice(Number(order.subtotal))}</strong>
                      </div>
                      <div className="mt-2 flex justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">Entrega</span>
                        <strong>
                          {Number(order.shippingAmount)
                            ? formatPrice(Number(order.shippingAmount))
                            : 'Gratis'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <details className="border-t">
                    <summary className="cursor-pointer px-4 py-3 text-sm font-extrabold text-primary">
                      Ver {order.items.length}{' '}
                      {order.items.length === 1 ? 'producto' : 'productos'}
                    </summary>
                    <ul className="divide-y border-t bg-background/45">
                      {order.items.map((item) => (
                        <li
                          key={item.id}
                          className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                        >
                          <span>
                            <strong>
                              {Number(item.quantity).toLocaleString('es-AR')}×{' '}
                              {item.productName}
                            </strong>
                            {item.presentation ? (
                              <span className="ml-2 text-muted-foreground">
                                ({item.presentation})
                              </span>
                            ) : null}
                          </span>
                          <span className="font-bold">
                            {formatPrice(Number(item.subtotal))}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border bg-white p-8 text-center text-muted-foreground">
            Este cliente todavía no tiene compras registradas.
          </div>
        )}
      </section>
    </div>
  )
}
