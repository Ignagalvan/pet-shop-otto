import Link from 'next/link'
import { PawPrint } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BRAND_FULL_NAME, BRAND_NAME, BRAND_SUFFIX } from '@/lib/data'

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link
      href="/"
      className={cn('flex items-center gap-2.5 focus-visible:outline-none', className)}
      aria-label={`${BRAND_FULL_NAME} — Inicio`}
    >
      <span className="flex size-10 items-center justify-center rounded-2xl bg-brand text-primary-foreground shadow-sm">
        <PawPrint className="size-5.5" />
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block font-display text-lg font-extrabold text-brand">
            {BRAND_NAME}
          </span>
          {BRAND_SUFFIX && (
            <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-brown">
              {BRAND_SUFFIX}
            </span>
          )}
        </span>
      )}
    </Link>
  )
}
