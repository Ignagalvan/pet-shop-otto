'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Boxes,
  FileSpreadsheet,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageSearch,
  PackagePlus,
  Settings,
  ShoppingBag,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Logo } from '@/components/logo'
import { useToast } from '@/components/toast-provider'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const links = [
  { href: '/admin', label: 'Resumen', icon: LayoutDashboard },
  { href: '/admin/productos', label: 'Productos', icon: PackageSearch },
  { href: '/admin/importar', label: 'Importar Excel', icon: FileSpreadsheet },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag },
  {
    href: '/admin/pedidos-especiales',
    label: 'A pedido',
    icon: PackagePlus,
  },
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
  { href: '/admin/historial', label: 'Historial', icon: History },
  { href: '/admin/configuracion', label: 'Configuración', icon: Settings },
]

type LiveOrder = {
  id?: string
  order_number?: number
  status?: string
  payment_status?: string
  created_at?: string
}

const orderStatusNotifications: Record<
  string,
  { label: string; variant: 'success' | 'error' | 'info' | 'warning' }
> = {
  pending: { label: 'Nuevo', variant: 'warning' },
  confirmed: { label: 'Confirmado', variant: 'info' },
  preparing: { label: 'Preparando', variant: 'warning' },
  ready: { label: 'Listo para entregar', variant: 'success' },
  completed: { label: 'Completado', variant: 'success' },
  cancelled: { label: 'Cancelado', variant: 'error' },
}

function displayLiveOrderNumber(order: LiveOrder) {
  if (!order.order_number) return 'nuevo'
  const year = order.created_at
    ? new Date(order.created_at).getFullYear()
    : new Date().getFullYear()
  return `OTTO-${year}-${String(order.order_number).padStart(6, '0')}`
}

export function AdminShell({
  children,
  initialNewOrderCount,
}: {
  children: ReactNode
  initialNewOrderCount: number
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [newOrderCount, setNewOrderCount] = useState(initialNewOrderCount)
  const [badgeAnimationId, setBadgeAnimationId] = useState(0)

  useEffect(() => {
    router.prefetch('/admin')
    router.prefetch('/admin/productos')
    router.prefetch('/admin/importar')
    router.prefetch('/admin/pedidos')
    router.prefetch('/admin/pedidos-especiales')
    router.prefetch('/admin/clientes')
    router.prefetch('/admin/historial')
    router.prefetch('/admin/configuracion')
  }, [router])

  useEffect(() => {
    if (pathname === '/admin/login') return

    const supabase = createSupabaseBrowserClient()

    async function refreshNewOrderCount() {
      const { count, error } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')

      if (!error) setNewOrderCount(count ?? 0)
    }

    function refreshWhenVisible() {
      if (document.visibilityState === 'visible') {
        void refreshNewOrderCount()
      }
    }

    function animateOrderBadge() {
      setBadgeAnimationId((current) => current + 1)
    }

    void refreshNewOrderCount()
    const interval = window.setInterval(refreshNewOrderCount, 30_000)
    window.addEventListener('focus', refreshNewOrderCount)
    document.addEventListener('visibilitychange', refreshWhenVisible)

    let disposed = false
    let ordersChannel: ReturnType<typeof supabase.channel> | null = null

    async function subscribeToOrders() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.access_token) {
        await supabase.realtime.setAuth(session.access_token)
      }
      if (disposed) return

      ordersChannel = supabase
        .channel('admin-orders-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const order = payload.new as LiveOrder
          if (order.status === 'pending') {
            setNewOrderCount((current) => current + 1)
            animateOrderBadge()
          }
          toast(
            `Nuevo pedido ${displayLiveOrderNumber(order)}`,
            'warning',
          )
          void refreshNewOrderCount()
          router.refresh()
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const previousOrder = payload.old as LiveOrder
          const order = payload.new as LiveOrder
          const statusChanged =
            Boolean(order.status) && order.status !== previousOrder.status
          const paymentChanged =
            Boolean(order.payment_status) &&
            order.payment_status !== previousOrder.payment_status

          if (statusChanged) {
            const notification =
              orderStatusNotifications[order.status ?? ''] ??
              orderStatusNotifications.confirmed
            toast(
              `${displayLiveOrderNumber(order)}: ${notification.label}`,
              notification.variant,
            )
            animateOrderBadge()
          } else if (paymentChanged) {
            const paid = order.payment_status === 'paid'
            toast(
              `${displayLiveOrderNumber(order)}: ${
                paid ? 'Pago confirmado' : 'Pago pendiente'
              }`,
              paid ? 'success' : 'warning',
            )
          }

          if (statusChanged || paymentChanged) {
            void refreshNewOrderCount()
            router.refresh()
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'special_orders' },
        () => {
          toast('Nueva solicitud de producto a pedido', 'warning')
          router.refresh()
        },
      )
      .subscribe()
    }

    void subscribeToOrders()

    return () => {
      disposed = true
      window.clearInterval(interval)
      window.removeEventListener('focus', refreshNewOrderCount)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
      if (ordersChannel) void supabase.removeChannel(ordersChannel)
    }
  }, [pathname, router, toast])

  if (pathname === '/admin/login') return children

  async function signOut() {
    await createSupabaseBrowserClient().auth.signOut()
    router.replace('/admin/login')
    router.refresh()
  }

  const navigation = (
    <>
      <div className="flex h-20 items-center justify-between border-b px-5">
        <Logo />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl p-2 text-muted-foreground lg:hidden"
          aria-label="Cerrar menú"
        >
          <X className="size-5" />
        </button>
      </div>
      <div className="px-4 py-5">
        <p className="px-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground">
          Administración
        </p>
        <nav className="mt-3 space-y-1">
          {links.map((link) => {
            const active =
              link.href === '/admin'
                ? pathname === link.href
                : link.href === '/admin/pedidos'
                  ? pathname === link.href
                : pathname.startsWith(link.href)
            const Icon = link.icon
            const isOrdersLink = link.href === '/admin/pedidos'

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition',
                  active
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-foreground/75 hover:bg-primary/8 hover:text-primary',
                )}
              >
                <Icon className="size-5" />
                <span>{link.label}</span>
                {isOrdersLink && newOrderCount > 0 && (
                  <span
                    key={`${newOrderCount}-${badgeAnimationId}`}
                    className={cn(
                      'ml-auto rounded-full px-2 py-0.5 text-[10px] font-extrabold leading-none animate-in zoom-in-75 fade-in duration-300',
                      active
                        ? 'bg-white text-destructive'
                        : 'bg-destructive text-white',
                    )}
                    aria-label={`${newOrderCount} ${
                      newOrderCount === 1 ? 'pedido nuevo' : 'pedidos nuevos'
                    }`}
                  >
                    {newOrderCount}{' '}
                    {newOrderCount === 1 ? 'nuevo' : 'nuevos'}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="mt-auto border-t p-4">
        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="size-5" />
          Cerrar sesión
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r bg-white lg:flex">
        {navigation}
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-foreground/35 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="relative flex h-full w-[min(86vw,300px)] flex-col bg-white shadow-2xl">
            {navigation}
          </aside>
        </div>
      )}

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-white/95 px-4 backdrop-blur lg:px-8">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-xl border p-2 lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex items-center gap-2 text-sm font-extrabold text-primary">
            <Boxes className="size-5" />
            Gestión de Pet Shop Otto
          </div>
        </header>
        {children}
      </div>
    </div>
  )
}
