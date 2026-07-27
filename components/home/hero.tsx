import Image from 'next/image'
import Link from 'next/link'
import { ShoppingBag, ShieldCheck, Truck, HeartHandshake } from 'lucide-react'

const benefits = [
  { icon: Truck, text: 'Envíos rápidos' },
  { icon: ShieldCheck, text: 'Compra segura' },
  { icon: HeartHandshake, text: 'Atención personal' },
]

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-brand-light">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 lg:grid-cols-2 lg:py-20">
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-xs font-bold text-brand shadow-sm">
            <span className="size-2 rounded-full bg-success" />
            Nuevos ingresos cada semana
          </span>
          <h1 className="mt-4 text-balance text-4xl font-extrabold leading-[1.05] text-brand sm:text-5xl lg:text-6xl">
            Todo lo que tu mascota ama, en un solo lugar
          </h1>
          <p className="mt-4 max-w-md text-pretty text-base leading-relaxed text-foreground/80 sm:text-lg">
            Alimentos premium, juguetes, higiene y accesorios seleccionados con cariño. Comprá
            online y coordiná tu envío o retiro en el local.
          </p>
          <div className="mt-6">
            <Link
              href="/productos"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand px-7 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:bg-brand/90 active:scale-95 sm:w-auto"
            >
              <ShoppingBag className="size-5" />
              Comprar ahora
            </Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
            {benefits.map((b) => (
              <li key={b.text} className="flex items-center gap-2 text-sm font-semibold text-brand">
                <span className="flex size-9 items-center justify-center rounded-xl bg-card text-brand shadow-sm">
                  <b.icon className="size-4.5" />
                </span>
                {b.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-xl lg:aspect-square">
            <Image
              src="/images/hero-pets.png"
              alt="Perro y gato felices juntos"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-4 -left-4 hidden rounded-2xl border border-border bg-card p-4 shadow-lg sm:block">
            <p className="text-2xl font-extrabold text-brand">+5.000</p>
            <p className="text-xs font-medium text-muted-foreground">clientes felices</p>
          </div>
        </div>
      </div>
    </section>
  )
}
