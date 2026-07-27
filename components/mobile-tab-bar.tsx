'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, LayoutGrid, Search, Heart, ShoppingCart } from 'lucide-react'
import { useStore } from './store-provider'
import { cn } from '@/lib/utils'

export function MobileTabBar() {
  const pathname = usePathname()
  const { cartCount, favorites, openCart } = useStore()

  if (pathname === '/checkout' || pathname === '/pedido-confirmado') return null

  const tabs = [
    { label: 'Inicio', icon: Home, href: '/' },
    { label: 'Categorías', icon: LayoutGrid, href: '/productos' },
    { label: 'Buscar', icon: Search, href: '/productos' },
    { label: 'Favoritos', icon: Heart, href: '/favoritos', badge: favorites.length },
  ]

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden"
      aria-label="Navegación inferior"
    >
      <div className="grid grid-cols-5">
        {tabs.map((t) => {
          const active = pathname === t.href
          return (
            <Link
              key={t.label}
              href={t.href}
              className={cn(
                'relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                active ? 'text-brand' : 'text-muted-foreground',
              )}
            >
              <span className="relative">
                <t.icon className={cn('size-5.5', active && 'text-brand')} />
                {!!t.badge && t.badge > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex min-w-4 items-center justify-center rounded-full bg-promo px-1 text-[9px] font-bold text-promo-foreground">
                    {t.badge}
                  </span>
                )}
              </span>
              {t.label}
            </Link>
          )
        })}
        <button
          onClick={pathname === '/carrito' ? undefined : openCart}
          disabled={pathname === '/carrito'}
          aria-current={pathname === '/carrito' ? 'page' : undefined}
          className={cn(
            'relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
            pathname === '/carrito' ? 'text-brand' : 'text-muted-foreground',
          )}
        >
          <span className="relative">
            <ShoppingCart className="size-5.5" />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-1.5 flex min-w-4 items-center justify-center rounded-full bg-promo px-1 text-[9px] font-bold text-promo-foreground">
                {cartCount}
              </span>
            )}
          </span>
          Carrito
        </button>
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
