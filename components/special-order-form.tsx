'use client'

import { useState } from 'react'
import { CheckCircle2, Send } from 'lucide-react'

const input = 'mt-2 h-12 w-full rounded-xl border border-border bg-card px-4 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15'

export function SpecialOrderForm() {
  const [sent, setSent] = useState(false)
  if (sent) return <div className="rounded-3xl border border-success/25 bg-success/10 p-8 text-center"><CheckCircle2 className="mx-auto size-12 text-success" /><h2 className="mt-4 text-2xl font-extrabold">¡Solicitud recibida!</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Buscaremos el producto y te enviaremos precio, plazo y seña necesaria por WhatsApp.</p><button onClick={() => setSent(false)} className="mt-6 text-sm font-bold text-brand hover:underline">Hacer otra consulta</button></div>

  return (
    <form onSubmit={(event) => { event.preventDefault(); setSent(true) }} className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h2 className="text-2xl font-extrabold">Contanos qué necesitás</h2>
      <p className="mt-2 text-sm text-muted-foreground">Cuantos más datos nos pases, más rápido podremos cotizarlo.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-bold">Nombre y apellido<input required className={input} placeholder="Tu nombre" /></label>
        <label className="text-sm font-bold">WhatsApp<input required type="tel" className={input} placeholder="11 2345 6789" /></label>
        <label className="text-sm font-bold sm:col-span-2">Producto o marca<input required className={input} placeholder="Ej. alimento especial, medicamento, rascador..." /></label>
        <label className="text-sm font-bold">Para qué mascota<select required className={input} defaultValue=""><option value="" disabled>Elegir</option><option>Perro</option><option>Gato</option><option>Ave</option><option>Roedor</option><option>Caballo</option><option>Otra mascota</option></select></label>
        <label className="text-sm font-bold">Cantidad<input required type="number" min="1" defaultValue="1" className={input} /></label>
        <label className="text-sm font-bold sm:col-span-2">Detalles<textarea className="mt-2 min-h-28 w-full resize-y rounded-xl border border-border bg-card p-4 text-sm outline-none focus:border-brand" placeholder="Tamaño, presentación, sabor, modelo o cualquier dato útil." /></label>
        <label className="text-sm font-bold sm:col-span-2">Foto o referencia <span className="font-normal text-muted-foreground">(opcional)</span><input type="file" accept="image/*,.pdf" className="mt-2 block w-full rounded-xl border border-dashed border-border bg-secondary/40 p-4 text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-2 file:font-bold file:text-white" /></label>
      </div>
      <label className="mt-5 flex items-start gap-3 text-xs leading-5 text-muted-foreground"><input required type="checkbox" className="mt-1 size-4 accent-brand" /> Entiendo que el precio y el plazo se confirman antes de pagar, y que el encargo puede requerir una seña.</label>
      <button className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-extrabold text-white"><Send className="size-4" /> Solicitar cotización</button>
      <p className="mt-3 text-center text-xs text-muted-foreground">Formulario demostrativo: todavía no envía datos reales.</p>
    </form>
  )
}
