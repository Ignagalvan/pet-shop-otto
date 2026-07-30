import type { Metadata } from 'next'
import { AtSign, Clock, MapPin, MessageCircle, Phone } from 'lucide-react'
import { ContactForm } from '@/components/contact-form'
import { PageHero } from '@/components/page-hero'
import { waLink } from '@/lib/whatsapp'
import { formatBusinessHours } from '@/lib/business-hours'
import { getPublicStoreSettings } from '@/lib/store-settings-server'
import { whatsappDisplay } from '@/lib/store-settings'

export const metadata: Metadata = { title: 'Contacto' }

export default async function ContactPage() {
  const settings = await getPublicStoreSettings()
  const info = [
    { icon: MapPin, title: 'Nuestro local', text: settings.address, href: undefined },
    { icon: Clock, title: 'Horarios', text: formatBusinessHours(settings.businessHours), href: undefined },
    { icon: Phone, title: 'WhatsApp', text: whatsappDisplay(settings.whatsappNumber), href: waLink('Hola Pet Shop Otto, quiero hacer una consulta.', settings.whatsappNumber) },
    ...(settings.email
      ? [{ icon: AtSign, title: 'Correo', text: settings.email, href: `mailto:${settings.email}` }]
      : []),
    {
      icon: AtSign,
      title: 'Instagram',
      text: `@${settings.instagram}`,
      href: `https://www.instagram.com/${settings.instagram}/`,
    },
  ]
  return (
    <>
      <PageHero eyebrow="Estamos para ayudarte" title="Contacto" description="Consultanos por productos, pedidos, envíos o el cuidado de tu mascota." />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-[0.8fr_1.2fr]">
        <section>
          <h2 className="text-2xl font-extrabold">Hablemos</h2>
          <p className="mt-3 leading-7 text-muted-foreground">Elegí el canal que te resulte más cómodo. Por WhatsApp solemos responder más rápido.</p>
          <a href={waLink('Hola Pet Shop Otto, quiero hacer una consulta.', settings.whatsappNumber)} target="_blank" rel="noreferrer" className="mt-6 flex h-14 items-center justify-center gap-2 rounded-2xl bg-success text-sm font-extrabold text-white"><MessageCircle className="size-5" /> Abrir WhatsApp</a>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {info.map((item) => <div key={item.title} className="flex gap-3 rounded-2xl border border-border bg-card p-4"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-brand"><item.icon className="size-5" /></span><div><h3 className="text-sm font-extrabold">{item.title}</h3>{item.href ? <a href={item.href} target="_blank" rel="noopener noreferrer" className="mt-1 block text-sm font-bold text-brand hover:underline">{item.text}</a> : <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>}</div></div>)}
          </div>
        </section>
        <ContactForm whatsappNumber={settings.whatsappNumber} />
      </div>
    </>
  )
}
