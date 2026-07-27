import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2, Clock3, Package, Truck } from 'lucide-react'
import { PageHero } from '@/components/page-hero'
import { formatPrice } from '@/lib/format'

export const metadata: Metadata = { title: 'Mis pedidos' }

const orders = [
  { id: 'OTTO-2026-00124', date: '18 jul 2026', total: 49300, status: 'En camino', icon: Truck, tone: 'text-brand bg-brand-light' },
  { id: 'OTTO-2026-00087', date: '02 jun 2026', total: 15900, status: 'Entregado', icon: CheckCircle2, tone: 'text-success bg-success/10' },
  { id: 'OTTO-2026-00042', date: '21 abr 2026', total: 32900, status: 'Entregado', icon: CheckCircle2, tone: 'text-success bg-success/10' },
]

export default function OrdersPage() {
  return (
    <>
      <PageHero eyebrow="Mi cuenta · Demo" title="Mis pedidos" description="Consultá el estado y el historial de tus compras." />
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="space-y-4">
          {orders.map((order) => <article key={order.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex gap-3"><span className={`flex size-11 items-center justify-center rounded-xl ${order.tone}`}><order.icon className="size-5" /></span><div><p className="text-xs font-bold text-muted-foreground">{order.date}</p><h2 className="font-extrabold">{order.id}</h2></div></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${order.tone}`}>{order.status}</span></div><div className="mt-5 flex items-center justify-between border-t border-border pt-4"><span className="text-sm text-muted-foreground">Total <strong className="ml-2 text-foreground">{formatPrice(order.total)}</strong></span><button className="text-sm font-bold text-brand hover:underline">Ver detalle</button></div></article>)}
        </div>
        <div className="mt-8 rounded-2xl bg-secondary/60 p-5 text-center"><Clock3 className="mx-auto size-6 text-brand" /><p className="mt-2 text-sm font-bold">Datos de demostración</p><p className="mt-1 text-xs text-muted-foreground">Los pedidos reales aparecerán cuando conectemos la base de datos.</p></div>
        <Link href="/productos" className="mx-auto mt-7 flex h-12 w-fit items-center justify-center gap-2 rounded-xl bg-brand px-6 text-sm font-bold text-white"><Package className="size-4" /> Hacer un nuevo pedido</Link>
      </div>
    </>
  )
}
