'use client'

import { BadgeCheck, Headphones, ShieldCheck, Truck } from "lucide-react"
import { useStore } from "@/components/store-provider"

export function TrustNewsletter({ brands }: { brands: string[] }) {
  const { settings } = useStore()
  const trust = [
    {
      icon: Truck,
      title: settings.deliveryEnabled ? "Envíos configurados" : "Retiro en el local",
      text:
        settings.deliveryEnabled && settings.pickupEnabled
          ? "Elegí envío o retiro al comprar."
          : settings.deliveryEnabled
            ? "Recibí tu compra a domicilio."
            : "Retirá tu compra sin costo.",
    },
    { icon: ShieldCheck, title: "Compra segura", text: "Pagos protegidos y datos cuidados." },
    { icon: BadgeCheck, title: "Pedido confirmado", text: "Stock y entrega se validan por WhatsApp." },
    { icon: Headphones, title: "Atención humana", text: "Te asesoramos por WhatsApp." },
  ]

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 md:py-14">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {trust.map((t) => (
          <div key={t.title} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
              <t.icon className="size-5" />
            </span>
            <div>
              <p className="font-bold text-foreground">{t.title}</p>
              <p className="text-sm text-muted-foreground">{t.text}</p>
            </div>
          </div>
        ))}
      </div>

      {brands.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 rounded-2xl border border-border bg-card px-6 py-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Trabajamos con
          </span>
          {brands.map((b) => (
            <span key={b} className="text-sm font-extrabold text-foreground/50">
              {b}
            </span>
          ))}
        </div>
      )}
    </section>
  )
}
