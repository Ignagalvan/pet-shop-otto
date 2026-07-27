import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"

export function PromoBanners() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/productos?categoria=alimentos&mascota=perros"
          className="group relative flex min-h-44 items-center overflow-hidden rounded-3xl bg-brand p-6 text-primary-foreground shadow-sm md:p-8"
        >
          <div className="relative z-10 max-w-[62%]">
            <span className="text-xs font-bold uppercase tracking-widest text-primary-foreground/70">
              Ofertas de la semana
            </span>
            <h3 className="mt-2 text-pretty text-2xl font-extrabold leading-tight md:text-3xl">
              Hasta 20% en alimentos para perros
            </h3>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold underline-offset-4 group-hover:underline">
              Ver ofertas <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
          <div className="absolute -right-4 bottom-0 h-40 w-40 md:h-52 md:w-52">
            <Image src="/images/pet-dog.png" alt="" fill sizes="208px" className="object-contain" />
          </div>
        </Link>

        <Link
          href="/productos?categoria=juguetes&mascota=gatos"
          className="group relative flex min-h-44 items-center overflow-hidden rounded-3xl bg-brown p-6 text-brown-foreground shadow-sm md:p-8"
        >
          <div className="relative z-10 max-w-[62%]">
            <span className="text-xs font-bold uppercase tracking-widest text-brown-foreground/70">
              Nuevos ingresos
            </span>
            <h3 className="mt-2 text-pretty text-2xl font-extrabold leading-tight md:text-3xl">
              Juguetes que tu gato va a amar
            </h3>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold underline-offset-4 group-hover:underline">
              Descubrir <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
          <div className="absolute -right-4 bottom-0 h-40 w-40 md:h-52 md:w-52">
            <Image src="/images/pet-cat.png" alt="" fill sizes="208px" className="object-contain" />
          </div>
        </Link>
      </div>
    </section>
  )
}
