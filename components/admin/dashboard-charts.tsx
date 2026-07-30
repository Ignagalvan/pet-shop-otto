import { PackageOpen, Store, Truck } from 'lucide-react'
import { formatPrice } from '@/lib/format'

export type SalesDay = {
  date: string
  total: number
  orders: number
}

export type TopProduct = {
  name: string
  quantity: number
  revenue: number
}

const shortDay = new Intl.DateTimeFormat('es-AR', {
  weekday: 'short',
  timeZone: 'UTC',
})

function percentage(value: number, maximum: number) {
  if (maximum <= 0 || value <= 0) return 0
  return Math.max(Math.round((value / maximum) * 100), 8)
}

export function SalesBarChart({ data }: { data: SalesDay[] }) {
  const maximum = Math.max(...data.map((item) => Number(item.total)), 0)
  const total = data.reduce((sum, item) => sum + Number(item.total), 0)

  return (
    <article className="min-w-0 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold">Ventas de los últimos 7 días</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pedidos generados, sin contar cancelados.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Total
          </p>
          <p className="mt-1 text-lg font-extrabold">{formatPrice(total)}</p>
        </div>
      </div>

      <div
        className="mt-7 grid h-52 grid-cols-7 items-end gap-2 border-b border-dashed pb-2 sm:gap-3"
        role="img"
        aria-label="Gráfico de ventas generadas durante los últimos siete días"
      >
        {data.map((item) => {
          const value = Number(item.total)
          const height = percentage(value, maximum)
          return (
            <div key={item.date} className="flex h-full min-w-0 flex-col justify-end">
              <div className="group relative flex flex-1 items-end justify-center">
                <span className="pointer-events-none absolute bottom-[calc(100%+8px)] z-10 hidden whitespace-nowrap rounded-lg bg-foreground px-2 py-1 text-[10px] font-bold text-white shadow-lg group-hover:block">
                  {formatPrice(value)} · {item.orders}{' '}
                  {Number(item.orders) === 1 ? 'pedido' : 'pedidos'}
                </span>
                <div
                  className={`w-full max-w-12 rounded-t-lg transition ${
                    value > 0
                      ? 'bg-gradient-to-t from-primary to-primary/65'
                      : 'h-1.5 bg-muted'
                  }`}
                  style={value > 0 ? { height: `${height}%` } : undefined}
                  title={`${formatPrice(value)} · ${item.orders} ${
                    Number(item.orders) === 1 ? 'pedido' : 'pedidos'
                  }`}
                />
              </div>
              <span className="mt-2 truncate text-center text-[10px] font-bold capitalize text-muted-foreground sm:text-xs">
                {shortDay.format(new Date(`${item.date}T00:00:00Z`))}
              </span>
            </div>
          )
        })}
      </div>
    </article>
  )
}

export function TopProductsChart({ products }: { products: TopProduct[] }) {
  const maximum = Math.max(...products.map((item) => Number(item.quantity)), 0)

  return (
    <article className="min-w-0 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-extrabold">Productos más vendidos</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Cantidad vendida durante los últimos 30 días.
      </p>

      {products.length ? (
        <ol className="mt-6 space-y-5">
          {products.map((product, index) => (
            <li key={product.name}>
              <div className="flex items-start justify-between gap-3 text-sm">
                <p className="min-w-0 truncate font-extrabold">
                  <span className="mr-2 text-primary">{index + 1}.</span>
                  {product.name}
                </p>
                <span className="shrink-0 font-bold text-muted-foreground">
                  {Number(product.quantity).toLocaleString('es-AR')}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-success"
                  style={{
                    width: `${percentage(Number(product.quantity), maximum)}%`,
                  }}
                />
              </div>
              <p className="mt-1 text-right text-xs text-muted-foreground">
                {formatPrice(Number(product.revenue))} generados
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <div className="mt-6 rounded-xl bg-background p-8 text-center">
          <PackageOpen className="mx-auto size-8 text-muted-foreground/60" />
          <p className="mt-3 text-sm text-muted-foreground">
            Todavía no hay ventas suficientes para comparar productos.
          </p>
        </div>
      )}
    </article>
  )
}

export function FulfillmentChart({
  delivery,
  pickup,
}: {
  delivery: number
  pickup: number
}) {
  const total = Number(delivery) + Number(pickup)
  const deliveryPercent = total ? Math.round((Number(delivery) / total) * 100) : 0
  const pickupPercent = total ? 100 - deliveryPercent : 0

  return (
    <article className="rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="text-lg font-extrabold">Formas de entrega</h2>
      <p className="mt-1 text-sm text-muted-foreground">Últimos 30 días.</p>

      <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-muted">
        {total ? (
          <>
            <div
              className="bg-primary"
              style={{ width: `${deliveryPercent}%` }}
              aria-label={`${deliveryPercent}% envíos`}
            />
            <div
              className="bg-success"
              style={{ width: `${pickupPercent}%` }}
              aria-label={`${pickupPercent}% retiros`}
            />
          </>
        ) : null}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-primary/8 p-3">
          <Truck className="size-4 text-primary" />
          <p className="mt-2 text-xl font-extrabold">{deliveryPercent}%</p>
          <p className="text-xs text-muted-foreground">
            {Number(delivery)} {Number(delivery) === 1 ? 'envío' : 'envíos'}
          </p>
        </div>
        <div className="rounded-xl bg-success/8 p-3">
          <Store className="size-4 text-success" />
          <p className="mt-2 text-xl font-extrabold">{pickupPercent}%</p>
          <p className="text-xs text-muted-foreground">
            {Number(pickup)} {Number(pickup) === 1 ? 'retiro' : 'retiros'}
          </p>
        </div>
      </div>
    </article>
  )
}
