'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  Banknote,
  CreditCard,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Store,
  Truck,
} from 'lucide-react'
import { useStore } from './store-provider'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'
import { waLink } from '@/lib/whatsapp'
import { buildOrderMessage } from '@/lib/cart-message'
import { createOrderAction } from '@/app/checkout/actions'

const field = 'h-12 min-w-0 w-full rounded-xl border border-border bg-card px-3.5 text-base outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15 sm:text-sm'
const paymentLabels: Record<string, string> = {
  link: 'Link de pago con tarjeta',
  transferencia: 'Transferencia bancaria',
  entrega: 'Pago al recibir',
  whatsapp: 'Coordinar pago por WhatsApp',
}

export function CheckoutClient() {
  const router = useRouter()
  const { items, subtotal, clearCart } = useStore()
  const active = items.filter((item) => !item.savedForLater)
  const checkoutKey = useRef<string | null>(null)
  const [delivery, setDelivery] = useState<'envio' | 'retiro'>('envio')
  const [payment, setPayment] = useState<'link' | 'transferencia' | 'entrega' | 'whatsapp'>('link')
  const [accepted, setAccepted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [isPending, startTransition] = useTransition()
  const shipping = delivery === 'retiro' || subtotal >= 40000 ? 0 : 4500

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!active.length || !accepted || isPending) return

    const form = new FormData(event.currentTarget)
    const read = (name: string) => String(form.get(name) ?? '').trim()
    const customer = {
      name: read('name'),
      phone: read('phone'),
      email: read('email'),
      pet: read('pet') || undefined,
    }
    const deliveryData = {
      type: delivery,
      address: read('address') || undefined,
      city: read('city') || undefined,
      postalCode: read('postalCode') || undefined,
      notes: read('notes') || undefined,
    }
    const orderItems = active.flatMap((item) => {
      if (!item.variantId) return []
      const isKg = item.saleMode === 'kg' || item.variantId.endsWith(':kg')
      return [{
        variantId: item.variantId.replace(/:kg$/, ''),
        mode: isKg ? 'kg' as const : 'package' as const,
        quantity: item.quantity,
      }]
    })

    if (orderItems.length !== active.length) {
      setSubmitError('Actualizá la página y volvé a agregar los productos al carrito.')
      return
    }

    setSubmitError('')
    checkoutKey.current ??= crypto.randomUUID()

    const whatsappWindow = window.open('about:blank', '_blank')
    if (whatsappWindow) {
      whatsappWindow.opener = null
      whatsappWindow.document.title = 'Preparando pedido…'
      whatsappWindow.document.body.textContent = 'Estamos preparando tu pedido para WhatsApp…'
    }

    startTransition(async () => {
      let result
      try {
        result = await createOrderAction({
          checkoutKey: checkoutKey.current!,
          customer,
          delivery: deliveryData,
          paymentMethod: payment,
          items: orderItems,
        })
      } catch {
        whatsappWindow?.close()
        setSubmitError('No pudimos conectarnos para registrar el pedido. Intentá nuevamente.')
        return
      }

      if (!result.ok) {
        whatsappWindow?.close()
        setSubmitError(result.error)
        return
      }

      const message = buildOrderMessage(active, {
        orderNumber: result.order.orderNumber,
        customer,
        delivery: deliveryData,
        payment: paymentLabels[payment],
        subtotal: result.order.subtotal,
        shipping: result.order.shipping,
        total: result.order.total,
      })

      sessionStorage.setItem('otto-last-order-message', message)
      let whatsappOpened = false

      if (whatsappWindow) {
        whatsappWindow.location.href = waLink(message)
        whatsappOpened = true
      }

      clearCart()
      router.push(
        `/pedido-confirmado?numero=${encodeURIComponent(result.order.orderNumber)}&whatsapp=${whatsappOpened ? '1' : '0'}`,
      )
    })
  }

  if (!active.length) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
        <span className="flex size-20 items-center justify-center rounded-full bg-secondary text-brand"><CreditCard className="size-9" /></span>
        <h2 className="mt-5 text-2xl font-extrabold">Primero agregá un producto</h2>
        <p className="mt-2 text-muted-foreground">Tu checkout está listo. Solo falta elegir qué llevar.</p>
        <Link href="/productos" className="mt-7 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white">Ver productos</Link>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="mx-auto grid max-w-7xl gap-6 px-3 py-6 sm:px-4 sm:py-10 lg:grid-cols-[minmax(0,1fr)_390px] lg:gap-8">
      <div className="min-w-0 space-y-4 sm:space-y-6">
        <FormSection number="1" title="Tus datos" description="Te contactaremos para confirmar el pedido.">
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <label className="min-w-0 text-sm font-bold">Nombre y apellido<input required name="name" autoComplete="name" className={`${field} mt-2`} placeholder="Ej. Martina Gómez" /></label>
            <label className="min-w-0 text-sm font-bold">WhatsApp<input required name="phone" type="tel" inputMode="tel" autoComplete="tel" className={`${field} mt-2`} placeholder="11 2345 6789" /></label>
            <label className="min-w-0 text-sm font-bold md:col-span-2">Correo electrónico<input required name="email" type="email" inputMode="email" autoComplete="email" className={`${field} mt-2`} placeholder="tu@email.com" /></label>
            <label className="min-w-0 text-sm font-bold md:col-span-2">Nombre de tu mascota <span className="font-normal text-muted-foreground">(opcional)</span><input name="pet" className={`${field} mt-2`} placeholder="Otto" /></label>
          </div>
        </FormSection>

        <FormSection number="2" title="Entrega" description="Elegí cómo querés recibir tu compra.">
          <div className="grid gap-3 md:grid-cols-2">
            <Choice active={delivery === 'envio'} onClick={() => setDelivery('envio')} icon={Truck} title="Envío a domicilio" detail={subtotal >= 40000 ? 'Gratis por tu compra' : 'Desde $ 4.500'} />
            <Choice active={delivery === 'retiro'} onClick={() => setDelivery('retiro')} icon={Store} title="Retiro en el local" detail="Gratis · Coordinamos horario" />
          </div>
          {delivery === 'envio' && (
            <div className="mt-5 grid min-w-0 gap-4 md:grid-cols-2">
              <label className="min-w-0 text-sm font-bold md:col-span-2">Dirección<input required name="address" className={`${field} mt-2`} placeholder="Calle y número" autoComplete="street-address" /></label>
              <label className="min-w-0 text-sm font-bold">Localidad<input required name="city" className={`${field} mt-2`} placeholder="Localidad" autoComplete="address-level2" /></label>
              <label className="min-w-0 text-sm font-bold">Código postal<input required name="postalCode" inputMode="numeric" className={`${field} mt-2`} placeholder="Código postal" autoComplete="postal-code" /></label>
              <label className="min-w-0 text-sm font-bold md:col-span-2">Indicaciones <span className="font-normal text-muted-foreground">(opcional)</span><input name="notes" className={`${field} mt-2`} placeholder="Timbre, piso, entrecalles..." /></label>
            </div>
          )}
        </FormSection>

        <FormSection number="3" title="Forma de pago" description="Podés elegir la opción que te resulte más cómoda.">
          <div className="grid gap-3 md:grid-cols-2">
            <Choice active={payment === 'link'} onClick={() => setPayment('link')} icon={CreditCard} title="Link de pago" detail="Tarjetas y cuotas disponibles" />
            <Choice active={payment === 'transferencia'} onClick={() => setPayment('transferencia')} icon={Banknote} title="Transferencia" detail="Te enviamos los datos" />
            <Choice active={payment === 'entrega'} onClick={() => setPayment('entrega')} icon={MapPin} title="Pago al recibir" detail="Efectivo o transferencia" />
            <Choice active={payment === 'whatsapp'} onClick={() => setPayment('whatsapp')} icon={MessageCircle} title="Coordinar por WhatsApp" detail="Atención personalizada" />
          </div>
        </FormSection>
      </div>

      <aside className="h-fit min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm sm:rounded-3xl sm:p-6 lg:sticky lg:top-24">
        <h2 className="text-xl font-extrabold">Tu pedido</h2>
        <ul className="mt-5 max-h-72 space-y-4 overflow-y-auto">
          {active.map((item) => (
            <li key={item.key} className="flex items-center gap-3">
              <span className="relative size-14 shrink-0 rounded-xl bg-secondary"><Image src={item.product.image} alt="" fill sizes="56px" className="object-contain p-1" /><span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">{item.quantity}</span></span>
              <span className="min-w-0 flex-1"><span className="line-clamp-2 block text-sm font-bold">{item.product.name}</span><span className="text-xs text-muted-foreground">{item.variantLabel ?? item.product.presentation}</span></span>
              <strong className="shrink-0 text-sm">{formatPrice(item.unitPrice * item.quantity)}</strong>
            </li>
          ))}
        </ul>
        <div className="my-5 border-t border-border" />
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Productos</span><strong>{formatPrice(subtotal)}</strong></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Entrega</span><strong className={shipping === 0 ? 'text-success' : ''}>{shipping ? formatPrice(shipping) : 'Gratis'}</strong></div>
        </div>
        <div className="my-5 border-t border-border" />
        <div className="flex items-baseline justify-between"><span className="font-bold">Total</span><strong className="text-2xl">{formatPrice(subtotal + shipping)}</strong></div>
        <label className="mt-6 flex cursor-pointer items-start gap-3 text-xs leading-5 text-muted-foreground">
          <input required checked={accepted} onChange={(event) => setAccepted(event.target.checked)} type="checkbox" className="mt-1 size-4 accent-brand" />
          Confirmo que los datos son correctos y acepto las condiciones de compra.
        </label>
        {submitError && (
          <div
            role="alert"
            className="mt-5 flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-sm font-semibold leading-5 text-destructive"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            {submitError}
          </div>
        )}
        <button disabled={!accepted || isPending} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-success px-3 py-3 text-center text-sm font-extrabold leading-5 text-white disabled:cursor-not-allowed disabled:opacity-50">
          {isPending ? <LoaderCircle className="size-4 shrink-0 animate-spin" /> : <MessageCircle className="size-4 shrink-0" />}
          {isPending ? 'Registrando pedido…' : 'Confirmar y enviar pedido por WhatsApp'}
        </button>
        <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">Se abrirá WhatsApp con la orden completa. Solo tenés que tocar “Enviar”.</p>
      </aside>
    </form>
  )
}

function FormSection({ number, title, description, children }: { number: string; title: string; description: string; children: React.ReactNode }) {
  return <section className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm sm:rounded-3xl sm:p-7"><div className="mb-5 flex min-w-0 gap-3 sm:mb-6"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-extrabold text-white sm:size-9">{number}</span><div className="min-w-0"><h2 className="text-lg font-extrabold sm:text-xl">{title}</h2><p className="mt-0.5 text-sm leading-5 text-muted-foreground">{description}</p></div></div>{children}</section>
}

function Choice({ active, onClick, icon: Icon, title, detail }: { active: boolean; onClick: () => void; icon: typeof Truck; title: string; detail: string }) {
  return <button type="button" onClick={onClick} className={cn('flex min-h-20 min-w-0 items-center gap-3 rounded-xl border p-3 text-left transition-all sm:rounded-2xl sm:p-4', active ? 'border-brand bg-brand-light ring-1 ring-brand' : 'border-border bg-card hover:border-brand/40')}><span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', active ? 'bg-brand text-white' : 'bg-secondary text-brand')}><Icon className="size-5" /></span><span className="min-w-0"><strong className="block text-sm">{title}</strong><span className="mt-1 block text-xs leading-4 text-muted-foreground">{detail}</span></span></button>
}
