import Link from 'next/link'
import { MapPin, Clock, Phone, MessageCircle } from 'lucide-react'
import { Logo } from './logo'
import { waLink } from '@/lib/whatsapp'
import { BRAND_FULL_NAME } from '@/lib/data'
import { BUSINESS_HOURS } from '@/lib/business-hours'

const columns = [
  {
    title: 'Comprar',
    links: [
      { label: 'Todos los productos', href: '/productos' },
      { label: 'Perros', href: '/productos?mascota=perros' },
      { label: 'Gatos', href: '/productos?mascota=gatos' },
      { label: 'Ofertas', href: '/productos?oferta=1' },
      { label: 'Productos a pedido', href: '/pedidos-especiales' },
    ],
  },
  {
    title: 'Mi cuenta',
    links: [
      { label: 'Ingresar', href: '/cuenta' },
      { label: 'Mis pedidos', href: '/cuenta/pedidos' },
      { label: 'Mis mascotas', href: '/cuenta/mascotas' },
      { label: 'Favoritos', href: '/favoritos' },
    ],
  },
  {
    title: 'Ayuda',
    links: [
      { label: 'Preguntas frecuentes', href: '/ayuda#faq' },
      { label: 'Políticas de compra', href: '/ayuda#compra' },
      { label: 'Cambios y devoluciones', href: '/ayuda#cambios' },
      { label: 'Envíos', href: '/ayuda#envios' },
      { label: 'Privacidad', href: '/ayuda#privacidad' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Todo lo que tu mascota necesita, con atención personalizada y la mejor selección de
              productos para perros, gatos y más.
            </p>
            <ul className="mt-5 space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2.5">
                <MapPin className="size-4 shrink-0 text-brand" />
                General Paz 62, Salsipuedes, Córdoba
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="size-4 shrink-0 text-brand" />
                {BUSINESS_HOURS.display}
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 shrink-0 text-brand" />
                WhatsApp a confirmar
              </li>
            </ul>
            <div className="mt-5 flex items-center gap-2">
              <a
                href={waLink('Hola! Quiero hacer una consulta.')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-10 items-center justify-center rounded-xl bg-success/10 text-success transition-colors hover:bg-success/20"
                aria-label="WhatsApp"
              >
                <MessageCircle className="size-5" />
              </a>
              <a
                href="https://www.instagram.com/pet_shop.otto/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-10 items-center justify-center rounded-xl bg-secondary text-brand transition-colors hover:bg-brand-light"
                aria-label="Instagram de Pet Shop Otto"
                title="@pet_shop.otto"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-5"
                  aria-hidden="true"
                >
                  <rect width="18" height="18" x="3" y="3" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-bold text-foreground">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-brand"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {BRAND_FULL_NAME}. Todos los derechos reservados.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {['Visa', 'Mastercard', 'Transferencia', 'Efectivo', 'Mercado Pago'].map((m) => (
              <span
                key={m}
                className="rounded-md border border-border bg-secondary px-2.5 py-1 text-[11px] font-semibold text-muted-foreground"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
