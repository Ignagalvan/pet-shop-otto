'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { MessageCircle, X, Package, ShoppingBag, Sparkles, UserRound } from 'lucide-react'
import { waLink } from '@/lib/whatsapp'
import { cn } from '@/lib/utils'
import { BRAND_FULL_NAME } from '@/lib/data'
import { useStore } from '@/components/store-provider'

const options = [
  { icon: ShoppingBag, label: 'Consultar por un producto', msg: 'Hola! Quiero consultar por un producto.' },
  { icon: Package, label: 'Consultar por un pedido', msg: 'Hola! Quiero consultar por el estado de mi pedido.' },
  { icon: Sparkles, label: 'Solicitar un producto especial', msg: 'Hola! Quiero solicitar un producto que no está en el catálogo.' },
  { icon: UserRound, label: 'Hablar con un asesor', msg: 'Hola! Me gustaría hablar con un asesor.' },
]

export function WhatsappWidget() {
  const { settings } = useStore()
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  if (pathname === '/checkout' || pathname === '/pedido-confirmado') return null

  return (
    <div className="fixed bottom-6 right-6 z-50 hidden flex-col items-end gap-3 md:flex">
      {open && (
        <div className="w-72 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in slide-in-from-bottom-2 fade-in">
          <div className="flex items-center gap-3 bg-success p-4 text-success-foreground">
            <span className="flex size-10 items-center justify-center rounded-full bg-success-foreground/15">
              <MessageCircle className="size-5" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold">{BRAND_FULL_NAME}</p>
              <p className="text-xs opacity-90">Respondemos en minutos</p>
            </div>
          </div>
          <div className="p-2">
            {options.map((o) => (
              <a
                key={o.label}
                href={waLink(o.msg, settings.whatsappNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-secondary"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                  <o.icon className="size-4.5" />
                </span>
                <span className="text-sm font-semibold text-card-foreground">{o.label}</span>
              </a>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Cerrar chat de WhatsApp' : 'Abrir chat de WhatsApp'}
        aria-expanded={open}
        className={cn(
          'flex size-14 items-center justify-center rounded-full bg-success text-success-foreground shadow-xl transition-all hover:scale-105 active:scale-95',
          open && 'rotate-0',
        )}
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-7" />}
      </button>
    </div>
  )
}
