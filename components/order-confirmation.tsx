'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, MessageCircle, PackageCheck } from 'lucide-react'
import { waLink } from '@/lib/whatsapp'
import { useStore } from '@/components/store-provider'

export function OrderConfirmation() {
  const { settings } = useStore()
  const search = useSearchParams()
  const number = search.get('numero') ?? 'OTTO-DEMO'
  const sentToWhatsapp = search.get('whatsapp') === '1'

  function openWhatsapp() {
    const orderMessage = sessionStorage.getItem('otto-last-order-message')
    window.open(
      waLink(
        orderMessage || `Hola, quisiera consultar por mi pedido ${number}.`,
        settings.whatsappNumber,
      ),
      '_blank',
      'noopener,noreferrer',
    )
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-16 text-center sm:py-24">
      <span className="mx-auto flex size-24 items-center justify-center rounded-full bg-success/10 text-success"><CheckCircle2 className="size-12" /></span>
      <p className="mt-7 text-xs font-extrabold uppercase tracking-[0.2em] text-brown">Pedido recibido</p>
      <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">¡Gracias por elegir Pet Shop Otto!</h1>
      <p className="mt-4 leading-7 text-muted-foreground">
        Registramos tu pedido <strong className="text-foreground">{number}</strong>.{' '}
        {sentToWhatsapp
          ? 'Abrimos WhatsApp con la orden completa: revisala y tocá “Enviar” para que llegue al negocio.'
          : 'Te enviaremos la confirmación y los datos de pago por WhatsApp.'}
      </p>
      <div className="mt-8 rounded-3xl border border-border bg-card p-6 text-left">
        <h2 className="flex items-center gap-2 font-extrabold"><PackageCheck className="size-5 text-brand" /> ¿Qué sigue?</h2>
        <ol className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
          <li><strong className="text-foreground">1.</strong> Revisamos disponibilidad y datos de entrega.</li>
          <li><strong className="text-foreground">2.</strong> Te contactamos por WhatsApp para confirmar.</li>
          <li><strong className="text-foreground">3.</strong> Preparamos el pedido y te avisamos cuando salga o esté listo.</li>
        </ol>
      </div>
      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/productos" className="flex h-12 items-center justify-center rounded-xl bg-brand px-6 text-sm font-bold text-white">Seguir comprando</Link>
        <button
          type="button"
          onClick={openWhatsapp}
          className="flex h-12 items-center justify-center gap-2 rounded-xl border border-success/30 bg-success/10 px-6 text-sm font-bold text-success"
        >
          <MessageCircle className="size-4" />
          {sentToWhatsapp ? 'Reenviar por WhatsApp' : 'Enviar pedido por WhatsApp'}
        </button>
      </div>
    </section>
  )
}
