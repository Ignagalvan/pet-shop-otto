import type { Metadata } from 'next'
import Link from 'next/link'
import { CreditCard, HelpCircle, MessageCircle, PackageCheck, RefreshCcw, ShieldCheck, Truck } from 'lucide-react'
import { PageHero } from '@/components/page-hero'
import { waLink } from '@/lib/whatsapp'
import { getPublicStoreSettings } from '@/lib/store-settings-server'
import { formatPrice } from '@/lib/format'

export const metadata: Metadata = { title: 'Ayuda' }

const faqs = [
  { q: '¿Cómo sé si mi pedido fue confirmado?', a: 'Al finalizar recibís un número de pedido. Luego el equipo confirma stock, entrega y pago por WhatsApp.' },
  { q: '¿Cómo funcionan los productos a pedido?', a: 'Primero cotizamos precio y plazo. Si aceptás, puede solicitarse una seña para iniciar el encargo.' },
  { q: '¿Qué pasa si un producto no tiene stock?', a: 'Podés solicitar que te avisemos cuando ingrese o consultarnos por una alternativa similar.' },
]

export default async function HelpPage() {
  const settings = await getPublicStoreSettings()
  const deliverySteps = [
    ...(settings.deliveryEnabled
      ? [
          `Envío a domicilio por ${formatPrice(settings.shippingCost)}.`,
          ...(settings.freeShippingThreshold
            ? [`Envío gratis desde ${formatPrice(settings.freeShippingThreshold)}.`]
            : []),
        ]
      : []),
    ...(settings.pickupEnabled
      ? ['Retiro sin cargo en el local, previa confirmación.']
      : []),
    'Los plazos se coordinan al confirmar el pedido.',
  ]
  const paymentSteps = settings.paymentMethods.map((method) => ({
    link: 'Link de pago con tarjeta.',
    transferencia: 'Transferencia bancaria.',
    entrega: 'Pago al recibir.',
    whatsapp: 'Pago coordinado por WhatsApp.',
  })[method])
  const currentFaqs = [
    ...faqs,
    {
      q: '¿Qué formas de pago están disponibles?',
      a: `Al finalizar vas a poder elegir entre: ${paymentSteps
        .map((step) => step.replace(/\.$/, '').toLowerCase())
        .join(', ')}.`,
    },
    {
      q: '¿Cómo puedo recibir mi compra?',
      a:
        settings.deliveryEnabled && settings.pickupEnabled
          ? 'Podés elegir envío a domicilio o retiro sin cargo en el local.'
          : settings.deliveryEnabled
            ? 'Actualmente está disponible el envío a domicilio.'
            : 'Actualmente está disponible el retiro sin cargo en el local.',
    },
  ]
  return (
    <>
      <PageHero eyebrow="Centro de ayuda" title="¿Cómo podemos ayudarte?" description="Todo lo importante sobre compras, pagos, entregas y cambios, explicado de forma simple." />
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <HelpCard href="#compra" icon={PackageCheck} title="Cómo comprar" text="Del producto a la confirmación." />
          <HelpCard href="#envios" icon={Truck} title="Envíos y retiro" text="Opciones y coordinación." />
          <HelpCard href="#pagos" icon={CreditCard} title="Formas de pago" text="Online, transferencia o entrega." />
          <HelpCard href="#cambios" icon={RefreshCcw} title="Cambios" text="Condiciones y asistencia." />
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-8">
            <Guide id="compra" icon={PackageCheck} title="Cómo comprar" steps={['Elegí un producto y su presentación.', 'Agregalo al carrito y revisá las cantidades.', 'Completá tus datos, entrega y forma de pago.', 'Recibí la confirmación final por WhatsApp.']} />
            <Guide id="envios" icon={Truck} title="Envíos y retiro" steps={deliverySteps} />
            <Guide id="pagos" icon={CreditCard} title="Formas de pago" steps={[...paymentSteps, 'Los productos a pedido pueden requerir seña.']} />
            <Guide id="cambios" icon={RefreshCcw} title="Cambios y devoluciones" steps={['Conservá el producto sin uso y en su empaque.', 'Escribinos con el número de pedido.', 'Revisamos el caso y coordinamos el cambio.', 'Alimentos abiertos y productos de higiene pueden tener restricciones.']} />
            <section id="privacidad" className="scroll-mt-40 rounded-3xl border border-border bg-card p-6 sm:p-8">
              <h2 className="flex items-center gap-3 text-2xl font-extrabold"><ShieldCheck className="size-6 text-brand" /> Privacidad</h2>
              <p className="mt-4 leading-7 text-muted-foreground">Tus datos se usan únicamente para gestionar pedidos, entregas y consultas. La versión final incluirá la política legal completa y los proveedores de pago definitivos.</p>
            </section>
          </div>
          <aside className="h-fit rounded-3xl bg-brand p-6 text-white lg:sticky lg:top-36">
            <HelpCircle className="size-8" />
            <h2 className="mt-4 text-2xl font-extrabold">¿No encontraste la respuesta?</h2>
            <p className="mt-3 text-sm leading-6 text-white/75">Escribinos y te ayudamos a resolverlo personalmente.</p>
            <a href={waLink('Hola Pet Shop Otto, necesito ayuda con una consulta.', settings.whatsappNumber)} target="_blank" rel="noreferrer" className="mt-6 flex h-12 items-center justify-center gap-2 rounded-xl bg-white text-sm font-bold text-brand"><MessageCircle className="size-4" /> Hablar por WhatsApp</a>
            <Link href="/contacto" className="mt-3 flex h-11 items-center justify-center rounded-xl border border-white/25 text-sm font-bold">Ir a contacto</Link>
          </aside>
        </div>

        <section id="faq" className="mt-12 scroll-mt-40">
          <h2 className="text-2xl font-extrabold">Preguntas frecuentes</h2>
          <div className="mt-5 divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
            {currentFaqs.map((faq) => <details key={faq.q} className="group p-5 open:bg-secondary/25"><summary className="cursor-pointer list-none pr-8 font-extrabold marker:hidden">{faq.q}<span className="float-right text-brand transition-transform group-open:rotate-45">+</span></summary><p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{faq.a}</p></details>)}
          </div>
        </section>
      </div>
    </>
  )
}

function HelpCard({ href, icon: Icon, title, text }: { href: string; icon: typeof Truck; title: string; text: string }) {
  return <Link href={href} className="rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-1 hover:shadow-md"><span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-brand"><Icon className="size-5" /></span><h2 className="mt-4 font-extrabold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{text}</p></Link>
}

function Guide({ id, icon: Icon, title, steps }: { id: string; icon: typeof Truck; title: string; steps: string[] }) {
  return <section id={id} className="scroll-mt-40 rounded-3xl border border-border bg-card p-6 sm:p-8"><h2 className="flex items-center gap-3 text-2xl font-extrabold"><Icon className="size-6 text-brand" /> {title}</h2><ol className="mt-5 grid gap-3 sm:grid-cols-2">{steps.map((step, index) => <li key={step} className="flex gap-3 rounded-2xl bg-secondary/50 p-4 text-sm leading-6"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">{index + 1}</span>{step}</li>)}</ol></section>
}
