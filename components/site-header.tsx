'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  Heart,
  ShoppingCart,
  Menu,
  X,
  User,
  MessageCircle,
  Truck,
  CreditCard,
  Headphones,
  ChevronRight,
} from 'lucide-react'
import { Logo } from './logo'
import { SearchBar } from './search-bar'
import { useStore } from './store-provider'
import { waLink } from '@/lib/whatsapp'
import { cn } from '@/lib/utils'

const navLinks = [
  { label: 'Inicio', href: '/' },
  { label: 'Productos', href: '/productos' },
  { label: 'Perros', href: '/productos?mascota=perros' },
  { label: 'Gatos', href: '/productos?mascota=gatos' },
  { label: 'Otras mascotas', href: '/productos?mascota=otras' },
  { label: 'Productos a pedido', href: '/pedidos-especiales' },
  { label: 'Contacto', href: '/contacto' },
]

export function SiteHeader() {
  const { cartCount, cartAnimationId, favorites, openCart, settings } = useStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const onCartPage = pathname === '/carrito'
  const checkoutFlow = pathname === '/checkout' || pathname === '/pedido-confirmado'
  const deliveryText =
    settings.deliveryEnabled && settings.pickupEnabled
      ? 'Envíos y retiro en el local'
      : settings.deliveryEnabled
        ? 'Envíos a domicilio'
        : 'Retiro gratis en el local'
  const paymentNames = {
    link: 'link de pago',
    transferencia: 'transferencia',
    entrega: 'pago al recibir',
    whatsapp: 'WhatsApp',
  }
  const announcements = [
    { icon: Truck, text: deliveryText },
    {
      icon: CreditCard,
      text: `Pagá por ${settings.paymentMethods.map((method) => paymentNames[method]).join(', ')}`,
    },
    { icon: Headphones, text: 'Atención personalizada por WhatsApp' },
  ]

  if (checkoutFlow) {
    return (
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4">
          <Logo />
          <span className="ml-auto text-xs font-bold text-success">Compra segura</span>
        </div>
      </header>
    )
  }

  return (
    <>
      {/* Announcement strip */}
      <div className="bg-brand text-primary-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-8 overflow-hidden px-4 py-2 text-xs font-medium">
          {announcements.map((a, i) => (
            <span
              key={i}
              className={cn('flex items-center gap-1.5 whitespace-nowrap', i > 0 && 'hidden sm:flex')}
            >
              <a.icon className="size-3.5" />
              {a.text}
            </span>
          ))}
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center gap-4 md:h-20">
            <button
              onClick={() => setMenuOpen(true)}
              className="flex size-10 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-secondary lg:hidden"
              aria-label="Abrir menú"
            >
              <Menu className="size-6" />
            </button>

            <Logo className="shrink-0" />

            <div className="hidden flex-1 lg:block">
              <SearchBar />
            </div>

            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <Link
                href="/cuenta"
                className="hidden size-10 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-secondary sm:flex"
                aria-label="Mi cuenta"
              >
                <User className="size-5.5" />
              </Link>
              <Link
                href="/favoritos"
                className="relative hidden size-10 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-secondary sm:flex"
                aria-label="Favoritos"
              >
                <Heart className="size-5.5" />
                {favorites.length > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex min-w-4.5 items-center justify-center rounded-full bg-promo px-1 text-[10px] font-bold text-promo-foreground">
                    {favorites.length}
                  </span>
                )}
              </Link>
              <a
                href={waLink(
                  'Hola! Quiero hacer una consulta.',
                  settings.whatsappNumber,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden size-10 items-center justify-center rounded-xl text-success transition-colors hover:bg-success/10 md:flex"
                aria-label="Escribir por WhatsApp"
              >
                <MessageCircle className="size-5.5" />
              </a>
              {onCartPage ? (
                <span
                  data-cart-target
                  aria-current="page"
                  className="relative flex h-10 items-center gap-2 rounded-xl bg-secondary px-3 text-sm font-semibold text-brand"
                >
                  <ShoppingCart className="size-5" />
                  <span className="hidden sm:inline">Tu carrito</span>
                  {cartCount > 0 && <CartCount key={cartAnimationId} count={cartCount} />}
                </span>
              ) : (
                <button
                  data-cart-target
                  onClick={openCart}
                  className="relative flex h-10 items-center gap-2 rounded-xl bg-brand px-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-brand/90"
                  aria-label={`Carrito, ${cartCount} ${cartCount === 1 ? 'producto' : 'productos'}`}
                >
                  <ShoppingCart className="size-5" />
                  <span className="hidden sm:inline">Carrito</span>
                  {cartCount > 0 && <CartCount key={cartAnimationId} count={cartCount} />}
                </button>
              )}
            </div>
          </div>

          {/* Mobile search */}
          <div className="pb-3 lg:hidden">
            <SearchBar />
          </div>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 pb-2 lg:flex" aria-label="Navegación principal">
            {navLinks.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-foreground/80 transition-colors hover:bg-secondary hover:text-brand"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-in fade-in"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col bg-card shadow-2xl animate-in slide-in-from-left">
            <div className="flex items-center justify-between border-b border-border p-4">
              <Logo />
              <button
                onClick={() => setMenuOpen(false)}
                className="flex size-10 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-secondary"
                aria-label="Cerrar menú"
              >
                <X className="size-6" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3">
              {navLinks.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between rounded-xl px-4 py-3 text-base font-semibold text-foreground transition-colors hover:bg-secondary"
                >
                  {l.label}
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              ))}
            </nav>
            <div className="grid grid-cols-2 gap-2 border-t border-border p-3">
              <Link
                href="/cuenta"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                <User className="size-4" /> Mi cuenta
              </Link>
              <Link
                href="/favoritos"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                <Heart className="size-4" /> Favoritos
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function CartCount({ count }: { count: number }) {
  return (
    <span className="cart-count-bump flex min-w-5 items-center justify-center rounded-full bg-promo px-1 text-[11px] font-bold text-promo-foreground">
      {count}
    </span>
  )
}
