'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Boxes,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageSearch,
  Settings,
  ShoppingBag,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Logo } from '@/components/logo'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const links = [
  { href: '/admin', label: 'Resumen', icon: LayoutDashboard },
  { href: '/admin/productos', label: 'Productos', icon: PackageSearch },
  { href: '/admin/importar', label: 'Importar Excel', icon: FileSpreadsheet },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag, disabled: true },
  { href: '/admin/clientes', label: 'Clientes', icon: Users, disabled: true },
  { href: '/admin/configuracion', label: 'Configuración', icon: Settings, disabled: true },
]

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    router.prefetch('/admin')
    router.prefetch('/admin/productos')
    router.prefetch('/admin/importar')
  }, [router])

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
                : pathname.startsWith(link.href)
            const Icon = link.icon

            if (link.disabled) {
              return (
                <div
                  key={link.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-muted-foreground/55"
                >
                  <Icon className="size-5" />
                  {link.label}
                  <span className="ml-auto text-[10px] font-bold uppercase">Pronto</span>
                </div>
              )
            }

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
                {link.label}
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
