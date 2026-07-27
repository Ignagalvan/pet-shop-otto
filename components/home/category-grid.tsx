import Link from "next/link"
import Image from "next/image"
import { petTypes } from "@/lib/data"

export function CategoryGrid() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 md:py-14">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-foreground md:text-3xl text-balance">
            Comprá por tipo de mascota
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Encontrá todo lo que necesita tu compañero</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-6">
        {petTypes.map((pet) => (
          <Link
            key={pet.slug}
            href={`/productos?mascota=${pet.slug}`}
            className="group relative flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-4 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
          >
            <div className="relative h-24 w-24 overflow-hidden rounded-full bg-secondary/60 md:h-28 md:w-28">
              <Image
                src={pet.image || "/placeholder.svg"}
                alt={pet.label}
                fill
                sizes="112px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <span className="font-medium text-foreground">{pet.label}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
