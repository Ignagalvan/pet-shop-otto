import type { Metadata } from 'next'
import { BadgeCheck, HandCoins, PackageSearch, Truck } from 'lucide-react'
import { PageHero } from '@/components/page-hero'
import { SpecialOrderForm } from '@/components/special-order-form'
import { getPublicStoreSettings } from '@/lib/store-settings-server'

export const metadata: Metadata = { title: 'Productos a pedido' }

const steps = [
  { icon: PackageSearch, title: 'Lo buscamos', text: 'Decinos qué producto necesitás y conseguimos opciones.' },
  { icon: BadgeCheck, title: 'Te cotizamos', text: 'Confirmamos precio, disponibilidad y fecha estimada.' },
  { icon: HandCoins, title: 'Abonás la seña', text: 'Reservás el encargo con el medio de pago que elijas.' },
  { icon: Truck, title: 'Lo recibís', text: 'Te avisamos cuando llegue para envío o retiro.' },
]

export default async function SpecialOrdersPage() {
  const settings = await getPublicStoreSettings()
  return (
    <>
      <PageHero eyebrow="Lo conseguimos para vos" title="Productos a pedido" description="Si no está en el catálogo, contanos qué necesitás. Lo buscamos, te cotizamos y recién entonces decidís." />
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <section>
            <h2 className="text-2xl font-extrabold">Un encargo simple y transparente</h2>
            <p className="mt-3 leading-7 text-muted-foreground">Ideal para alimentos específicos, talles especiales, productos veterinarios o accesorios que no tenemos en stock habitual.</p>
            <div className="mt-7 space-y-4">
              {steps.map((step, index) => <article key={step.title} className="flex gap-4 rounded-2xl border border-border bg-card p-4"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-brand"><step.icon className="size-5" /></span><div><p className="text-xs font-bold uppercase tracking-wider text-brown">Paso {index + 1}</p><h3 className="font-extrabold">{step.title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{step.text}</p></div></article>)}
            </div>
          </section>
          <SpecialOrderForm whatsappNumber={settings.whatsappNumber} />
        </div>
      </div>
    </>
  )
}
