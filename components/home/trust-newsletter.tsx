"use client"

import { useState } from "react"
import { Truck, ShieldCheck, RotateCcw, Headphones, Send } from "lucide-react"
import { useToast } from "../toast-provider"
import { brands } from "@/lib/data"

const trust = [
  { icon: Truck, title: "Envíos rápidos", text: "A todo el país y retiro en el local." },
  { icon: ShieldCheck, title: "Compra segura", text: "Pagos protegidos y datos cuidados." },
  { icon: RotateCcw, title: "Cambios fáciles", text: "Hasta 30 días para cambiar productos." },
  { icon: Headphones, title: "Atención humana", text: "Te asesoramos por WhatsApp." },
]

export function TrustNewsletter() {
  const { toast } = useToast()
  const [email, setEmail] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    toast("¡Listo! Te suscribiste a nuestras novedades.", "success")
    setEmail("")
  }

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

      <div className="mt-6 overflow-hidden rounded-3xl bg-brand px-6 py-8 text-primary-foreground md:px-10 md:py-10">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center md:flex-row md:text-left">
          <div className="flex-1">
            <h3 className="text-pretty text-2xl font-extrabold md:text-3xl">
              Sumate a la manada
            </h3>
            <p className="mt-1.5 text-sm text-primary-foreground/80">
              Recibí ofertas exclusivas y consejos para el cuidado de tu mascota.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="flex w-full max-w-md gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Tu email"
              className="h-12 flex-1 rounded-xl border-0 bg-card px-4 text-sm text-foreground outline-none ring-offset-2 placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-card"
            />
            <button
              type="submit"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-success px-5 text-sm font-bold text-success-foreground transition-colors hover:bg-success/90"
            >
              <Send className="size-4" />
              <span className="hidden sm:inline">Suscribirme</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
