import Link from "next/link"
import { Bone, Cookie, Gamepad2, Droplets, BedDouble, Footprints, ShoppingBag } from "lucide-react"
import { categories } from "@/lib/data"
import { SectionHeading } from "../section-heading"

const iconMap = {
  bone: Bone,
  cookie: Cookie,
  "gamepad-2": Gamepad2,
  droplets: Droplets,
  "bed-double": BedDouble,
  footprints: Footprints,
  "shopping-bag": ShoppingBag,
} as const

export function ShopByCategory() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 md:py-14">
      <SectionHeading
        eyebrow="Categorías"
        title="Explorá por categoría"
        description="Todo organizado para que encuentres rápido lo que buscás."
        href="/productos"
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        {categories.map((c) => {
          const Icon = iconMap[c.icon as keyof typeof iconMap] ?? ShoppingBag
          return (
            <Link
              key={c.slug}
              href={`/productos?categoria=${c.slug}`}
              className="group flex flex-col items-center gap-2.5 rounded-2xl border border-border bg-card p-4 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-brand/40 hover:shadow-md"
            >
              <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-light text-brand transition-colors group-hover:bg-brand group-hover:text-primary-foreground">
                <Icon className="size-6" />
              </span>
              <span className="text-sm font-bold text-foreground">{c.label}</span>
              <span className="text-xs text-muted-foreground">{c.description}</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
