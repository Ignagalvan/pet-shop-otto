'use client'

import { useState } from 'react'
import { CheckCircle2, Send } from 'lucide-react'

export function ContactForm() {
  const [sent, setSent] = useState(false)
  if (sent) return <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-success/25 bg-success/10 p-8 text-center"><CheckCircle2 className="size-12 text-success" /><h2 className="mt-4 text-2xl font-extrabold">Mensaje preparado</h2><p className="mt-2 max-w-sm text-sm text-muted-foreground">En la versión final, esta consulta llegará al equipo de Pet Shop Otto.</p><button onClick={() => setSent(false)} className="mt-5 text-sm font-bold text-brand">Enviar otro mensaje</button></div>
  return (
    <form onSubmit={(event) => { event.preventDefault(); setSent(true) }} className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h2 className="text-2xl font-extrabold">Escribinos</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" placeholder="Tu nombre" />
        <Field label="WhatsApp" placeholder="11 2345 6789" type="tel" />
        <Field label="Email" placeholder="tu@email.com" type="email" wide />
        <label className="text-sm font-bold sm:col-span-2">Motivo<select className="mt-2 h-12 w-full rounded-xl border border-border bg-card px-4 outline-none focus:border-brand"><option>Consulta sobre un producto</option><option>Estado de mi pedido</option><option>Envíos y retiros</option><option>Cambios</option><option>Otro</option></select></label>
        <label className="text-sm font-bold sm:col-span-2">Mensaje<textarea required className="mt-2 min-h-32 w-full rounded-xl border border-border p-4 text-sm outline-none focus:border-brand" placeholder="¿Cómo podemos ayudarte?" /></label>
      </div>
      <button className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-bold text-white"><Send className="size-4" /> Enviar consulta</button>
      <p className="mt-3 text-center text-xs text-muted-foreground">Formulario demostrativo: todavía no envía datos reales.</p>
    </form>
  )
}

function Field({ label, placeholder, type = 'text', wide = false }: { label: string; placeholder: string; type?: string; wide?: boolean }) {
  return <label className={`text-sm font-bold ${wide ? 'sm:col-span-2' : ''}`}>{label}<input required type={type} className="mt-2 h-12 w-full rounded-xl border border-border bg-card px-4 text-sm outline-none focus:border-brand" placeholder={placeholder} /></label>
}
