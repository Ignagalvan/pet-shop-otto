import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string
  title: string
  description: string
}) {
  return (
    <section className="border-b border-border bg-gradient-to-br from-brand-light via-background to-background">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <nav className="mb-5 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-brand">Inicio</Link>
          <ChevronRight className="size-3.5" />
          <span className="text-foreground">{title}</span>
        </nav>
        {eyebrow && (
          <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.2em] text-brown">
            {eyebrow}
          </p>
        )}
        <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">{description}</p>
      </div>
    </section>
  )
}
