import {
  CalendarClock,
  ExternalLink,
  MessageCircle,
  PackageSearch,
  Phone,
  UserRound,
} from 'lucide-react'
import { SpecialOrderStatusForm } from '@/components/admin/special-order-status-form'
import { formatPrice } from '@/lib/format'
import { requireStaff } from '@/lib/supabase/staff'
import { argentinaWhatsappNumber, waLink } from '@/lib/whatsapp'

export const metadata = { title: 'Productos a pedido' }

type SpecialOrder = {
  id: string
  request_number: number
  status: string
  customer_name: string
  customer_phone: string
  product_name: string
  pet_type: string
  quantity: number
  details: string
  reference_url: string | null
  quoted_amount: number | null
  deposit_amount: number | null
  created_at: string
}

const statusLabels: Record<string, string> = {
  new: 'Nueva',
  quoted: 'Cotizada',
  awaiting_deposit: 'Esperando seña',
  deposit_paid: 'Seña pagada',
  ordered: 'Encargado',
  received: 'Recibido',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

const statusStyles: Record<string, string> = {
  new: 'bg-amber-100 text-amber-800',
  quoted: 'bg-sky-100 text-sky-800',
  awaiting_deposit: 'bg-orange-100 text-orange-800',
  deposit_paid: 'bg-emerald-100 text-emerald-800',
  ordered: 'bg-violet-100 text-violet-800',
  received: 'bg-teal-100 text-teal-800',
  delivered: 'bg-green-600 text-white',
  cancelled: 'bg-red-100 text-red-800',
}

const dateTime = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Argentina/Cordoba',
})

export default async function AdminSpecialOrdersPage() {
  const { supabase, profile } = await requireStaff()

  if (!profile) {
    return <div className="p-8">No tenés permiso para ver esta sección.</div>
  }

  const { data, error } = await supabase
    .from('special_orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  const requests = (data ?? []) as SpecialOrder[]

  return (
    <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
          <PackageSearch className="size-5" />
        </span>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brown">
            Seguimiento
          </p>
          <h1 className="mt-1 text-3xl font-extrabold">Productos a pedido</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cotizá el producto, registrá la seña y seguí cada encargo hasta la
            entrega.
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-7 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm font-bold text-destructive">
          {error.message}
        </p>
      )}

      {!error && requests.length === 0 && (
        <div className="mt-7 rounded-3xl border bg-white p-10 text-center">
          <PackageSearch className="mx-auto size-10 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-extrabold">
            Todavía no hay solicitudes
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Las solicitudes enviadas desde la tienda aparecerán acá.
          </p>
        </div>
      )}

      <div className="mt-7 space-y-5">
        {requests.map((request) => {
          const requestNumber = `ESP-${String(request.request_number).padStart(5, '0')}`
          const quoteMessage = [
            `🐾 *PET SHOP OTTO — ${requestNumber}*`,
            '',
            `Hola ${request.customer_name}, tenemos novedades sobre tu solicitud de *${request.product_name}*.`,
            request.quoted_amount !== null
              ? `*Precio cotizado:* ${formatPrice(request.quoted_amount)}`
              : '',
            request.deposit_amount !== null
              ? `*Seña requerida:* ${formatPrice(request.deposit_amount)}`
              : '',
            `*Estado:* ${statusLabels[request.status] ?? request.status}`,
            '',
            'Si estás de acuerdo, respondé este mensaje para continuar.',
          ]
            .filter(Boolean)
            .join('\n')

          return (
            <article
              key={request.id}
              className="overflow-hidden rounded-3xl border bg-white shadow-sm"
            >
              <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-secondary/35 px-5 py-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-extrabold">{requestNumber}</h2>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${
                        statusStyles[request.status] ??
                        'bg-secondary text-foreground'
                      }`}
                    >
                      {statusLabels[request.status] ?? request.status}
                    </span>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarClock className="size-3.5" />
                    {dateTime.format(new Date(request.created_at))}
                  </p>
                </div>
                <a
                  href={waLink(
                    quoteMessage,
                    argentinaWhatsappNumber(request.customer_phone),
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 items-center gap-2 rounded-xl bg-success px-4 text-sm font-extrabold text-white"
                >
                  <MessageCircle className="size-4" /> Contactar
                </a>
              </header>

              <div className="grid min-w-0 gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                <div className="min-w-0 space-y-4 text-sm">
                  <div className="flex gap-3">
                    <UserRound className="mt-0.5 size-5 shrink-0 text-primary" />
                    <div>
                      <p className="font-extrabold">{request.customer_name}</p>
                      <p className="mt-1 flex items-center gap-1 text-muted-foreground">
                        <Phone className="size-3.5" />
                        {request.customer_phone}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Producto solicitado
                    </p>
                    <p className="mt-1 font-extrabold">{request.product_name}</p>
                    <p className="mt-1 text-muted-foreground">
                      {request.pet_type} · Cantidad: {request.quantity}
                    </p>
                    {request.details && (
                      <p className="mt-2 break-words leading-6 text-muted-foreground [overflow-wrap:anywhere]">
                        {request.details}
                      </p>
                    )}
                    {request.reference_url && (
                      <a
                        href={request.reference_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1 font-bold text-primary hover:underline"
                      >
                        Ver foto o referencia
                        <ExternalLink className="size-3.5" />
                      </a>
                    )}
                  </div>
                </div>
                <SpecialOrderStatusForm
                  requestId={request.id}
                  status={request.status}
                  quotedAmount={request.quoted_amount}
                  depositAmount={request.deposit_amount}
                />
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
