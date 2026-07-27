import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkLabel = 'Ver todo',
}: {
  eyebrow?: string
  title: string
  description?: string
  href?: string
  linkLabel?: string
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && (
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-brown">
            {eyebrow}
          </span>
        )}
        <h2 className="mt-1 text-pretty text-2xl font-extrabold text-foreground sm:text-3xl">
          {title}
        </h2>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {description}
          </p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition-colors hover:text-brand/80"
        >
          {linkLabel}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  )
}
