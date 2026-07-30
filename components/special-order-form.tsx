'use client'

import { useRef, useState, useTransition } from 'react'
import { AlertCircle, CheckCircle2, LoaderCircle, MessageCircle } from 'lucide-react'
import { createSpecialOrderAction } from '@/app/pedidos-especiales/actions'
import { waLink } from '@/lib/whatsapp'

const input =
  'mt-2 h-12 w-full rounded-xl border border-border bg-card px-4 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15'

export function SpecialOrderForm({
  whatsappNumber,
}: {
  whatsappNumber: string
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [completed, setCompleted] = useState<{
    requestNumber: string
    whatsappMessage: string
  } | null>(null)

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isPending) return
    const formData = new FormData(event.currentTarget)
    const whatsappWindow = window.open('about:blank', '_blank')

    if (whatsappWindow) {
      whatsappWindow.opener = null
      whatsappWindow.document.body.textContent =
        'Estamos preparando tu solicitud para WhatsApp…'
    }

    setError('')
    startTransition(async () => {
      const result = await createSpecialOrderAction(formData)
      if (!result.ok) {
        whatsappWindow?.close()
        setError(result.error)
        return
      }

      if (whatsappWindow) {
        whatsappWindow.location.href = waLink(
          result.whatsappMessage,
          whatsappNumber,
        )
      }
      formRef.current?.reset()
      setCompleted(result)
    })
  }

  if (completed) {
    return (
      <div className="rounded-3xl border border-success/25 bg-success/10 p-8 text-center">
        <CheckCircle2 className="mx-auto size-12 text-success" />
        <h2 className="mt-4 text-2xl font-extrabold">¡Solicitud registrada!</h2>
        <p className="mt-2 text-sm font-bold text-brand">
          {completed.requestNumber}
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          La guardamos en el panel de Pet Shop Otto. Enviá el mensaje de
          WhatsApp para que puedan cotizarte precio, plazo y seña.
        </p>
        <a
          href={waLink(completed.whatsappMessage, whatsappNumber)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex h-12 items-center justify-center gap-2 rounded-xl bg-success px-5 text-sm font-extrabold text-white"
        >
          <MessageCircle className="size-4" /> Enviar por WhatsApp
        </a>
        <button
          type="button"
          onClick={() => setCompleted(null)}
          className="mt-5 text-sm font-bold text-brand hover:underline"
        >
          Hacer otra solicitud
        </button>
      </div>
    )
  }

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8"
    >
      <h2 className="text-2xl font-extrabold">Contanos qué necesitás</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Cuantos más datos nos pases, más rápido podremos cotizarlo.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-bold">
          Nombre y apellido
          <input
            required
            name="name"
            className={input}
            placeholder="Tu nombre"
            autoComplete="name"
          />
        </label>
        <label className="text-sm font-bold">
          WhatsApp
          <input
            required
            name="phone"
            type="tel"
            className={input}
            placeholder="11 2345 6789"
            autoComplete="tel"
          />
        </label>
        <label className="text-sm font-bold sm:col-span-2">
          Producto o marca
          <input
            required
            name="product"
            className={input}
            placeholder="Ej. alimento especial, medicamento, rascador..."
          />
        </label>
        <label className="text-sm font-bold">
          Para qué mascota
          <select required name="petType" className={input} defaultValue="">
            <option value="" disabled>
              Elegir
            </option>
            <option>Perro</option>
            <option>Gato</option>
            <option>Ave</option>
            <option>Pez</option>
            <option>Roedor</option>
            <option>Caballo</option>
            <option>Otra mascota</option>
          </select>
        </label>
        <label className="text-sm font-bold">
          Cantidad
          <input
            required
            name="quantity"
            type="number"
            min="1"
            max="999"
            defaultValue="1"
            className={input}
          />
        </label>
        <label className="text-sm font-bold sm:col-span-2">
          Detalles
          <textarea
            name="details"
            maxLength={2000}
            className="mt-2 min-h-28 w-full resize-y rounded-xl border border-border bg-card p-4 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
            placeholder="Tamaño, presentación, sabor, modelo o cualquier dato útil."
          />
        </label>
        <label className="text-sm font-bold sm:col-span-2">
          Foto o referencia{' '}
          <span className="font-normal text-muted-foreground">(opcional)</span>
          <input
            name="reference"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="mt-2 block w-full rounded-xl border border-dashed border-border bg-secondary/40 p-4 text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-2 file:font-bold file:text-white"
          />
          <span className="mt-1 block text-xs font-normal text-muted-foreground">
            Imagen o PDF de hasta 5 MB.
          </span>
        </label>
      </div>
      <label className="mt-5 flex items-start gap-3 text-xs leading-5 text-muted-foreground">
        <input required type="checkbox" className="mt-1 size-4 accent-brand" />
        Entiendo que el precio, el plazo y las condiciones de la seña se
        confirman antes de pagar.
      </label>
      {error && (
        <p
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm font-bold text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}
      <button
        disabled={isPending}
        className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-extrabold text-white disabled:cursor-wait disabled:opacity-60"
      >
        {isPending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <MessageCircle className="size-4" />
        )}
        {isPending ? 'Registrando solicitud…' : 'Solicitar por WhatsApp'}
      </button>
    </form>
  )
}
