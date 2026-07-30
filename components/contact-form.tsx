'use client'

import { MessageCircle } from 'lucide-react'
import { waLink } from '@/lib/whatsapp'

const input =
  'mt-2 h-12 w-full rounded-xl border border-border bg-card px-4 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15'

export function ContactForm({
  whatsappNumber,
}: {
  whatsappNumber: string
}) {
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const value = (name: string) => String(data.get(name) ?? '').trim()
    const message = [
      '🐾 *NUEVA CONSULTA — PET SHOP OTTO*',
      '',
      '👤 *DATOS DE CONTACTO*',
      `*Nombre:* ${value('name')}`,
      `*WhatsApp:* ${value('phone')}`,
      `*Email:* ${value('email')}`,
      '',
      '💬 *CONSULTA*',
      `*Motivo:* ${value('reason')}`,
      value('message'),
    ].join('\n')

    window.open(waLink(message, whatsappNumber), '_blank', 'noopener,noreferrer')
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8"
    >
      <h2 className="text-2xl font-extrabold">Escribinos</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Al enviar, abriremos WhatsApp con tu consulta lista para revisar.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" name="name" placeholder="Tu nombre" />
        <Field
          label="WhatsApp"
          name="phone"
          placeholder="11 2345 6789"
          type="tel"
        />
        <Field
          label="Email"
          name="email"
          placeholder="tu@email.com"
          type="email"
          wide
        />
        <label className="text-sm font-bold sm:col-span-2">
          Motivo
          <select name="reason" className={input}>
            <option>Consulta sobre un producto</option>
            <option>Estado de mi pedido</option>
            <option>Envíos y retiros</option>
            <option>Producto a pedido</option>
            <option>Otro</option>
          </select>
        </label>
        <label className="text-sm font-bold sm:col-span-2">
          Mensaje
          <textarea
            required
            name="message"
            maxLength={1200}
            className="mt-2 min-h-32 w-full rounded-xl border border-border p-4 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
            placeholder="¿Cómo podemos ayudarte?"
          />
        </label>
      </div>
      <button className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-success text-sm font-bold text-white transition hover:bg-success/90">
        <MessageCircle className="size-4" /> Enviar consulta por WhatsApp
      </button>
    </form>
  )
}

function Field({
  label,
  name,
  placeholder,
  type = 'text',
  wide = false,
}: {
  label: string
  name: string
  placeholder: string
  type?: string
  wide?: boolean
}) {
  return (
    <label className={`text-sm font-bold ${wide ? 'sm:col-span-2' : ''}`}>
      {label}
      <input
        required
        name={name}
        type={type}
        className={input}
        placeholder={placeholder}
      />
    </label>
  )
}
