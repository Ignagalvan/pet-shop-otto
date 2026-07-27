import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, Heart, MapPin, Package, PawPrint, UserRound } from 'lucide-react'
import { PageHero } from '@/components/page-hero'

export const metadata: Metadata = { title: 'Mi cuenta' }

const cards = [
  { icon: Package, title: 'Mis pedidos', text: 'Revisá compras y estados.', href: '/cuenta/pedidos' },
  { icon: PawPrint, title: 'Mis mascotas', text: 'Guardá sus datos y preferencias.', href: '/cuenta/mascotas' },
  { icon: Heart, title: 'Favoritos', text: 'Volvé a tus productos guardados.', href: '/favoritos' },
  { icon: MapPin, title: 'Direcciones', text: 'Agilizá tus próximos envíos.', href: '/cuenta#direcciones' },
]

export default function AccountPage() {
  return (
    <>
      <PageHero eyebrow="Área personal · Demo" title="Mi cuenta" description="Un espacio pensado para que cada cliente compre más rápido y cuide mejor a sus mascotas." />
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
          <section className="rounded-3xl bg-brand p-7 text-white">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-white/15"><UserRound className="size-7" /></span>
            <p className="mt-5 text-sm font-bold text-white/70">Cuenta de demostración</p>
            <h2 className="mt-1 text-2xl font-extrabold">¡Hola, familia de Otto!</h2>
            <p className="mt-3 text-sm leading-6 text-white/75">En la versión final, el cliente podrá ingresar con su email o teléfono para recuperar pedidos y datos guardados.</p>
            <button className="mt-6 h-12 w-full rounded-xl bg-white text-sm font-extrabold text-brand">Ingresar o crear cuenta</button>
          </section>
          <section>
            <h2 className="text-2xl font-extrabold">Todo en un solo lugar</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {cards.map((card) => <Link key={card.title} href={card.href} className="group flex min-h-36 flex-col rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-1 hover:shadow-md"><span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-brand"><card.icon className="size-5" /></span><div className="mt-4 flex items-end justify-between gap-4"><div><h3 className="font-extrabold">{card.title}</h3><p className="mt-1 text-sm text-muted-foreground">{card.text}</p></div><ChevronRight className="size-5 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-brand" /></div></Link>)}
            </div>
          </section>
        </div>
        <section id="direcciones" className="mt-10 scroll-mt-40 rounded-3xl border border-dashed border-border bg-card p-8 text-center">
          <MapPin className="mx-auto size-8 text-brand" /><h2 className="mt-3 text-xl font-extrabold">Direcciones guardadas</h2><p className="mt-2 text-sm text-muted-foreground">Al iniciar sesión, tus direcciones de entrega aparecerán acá.</p>
        </section>
      </div>
    </>
  )
}
