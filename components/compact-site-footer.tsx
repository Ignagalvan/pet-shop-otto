'use client'

import Link from 'next/link'
import { BRAND_FULL_NAME } from '@/lib/data'
import { useStore } from '@/components/store-provider'

export function CompactSiteFooter() {
  const { settings } = useStore()
  return (
    <footer data-footer="compact" className="mt-10 border-t border-border bg-card">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-center sm:flex-row sm:text-left">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} {BRAND_FULL_NAME}. Todos los derechos reservados.
        </p>
        <div className="flex items-center gap-4 text-xs font-bold">
          <Link href="/" className="text-muted-foreground transition-colors hover:text-brand">
            Volver al inicio
          </Link>
          <a
            href={`https://www.instagram.com/${settings.instagram}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand hover:underline"
          >
            @{settings.instagram}
          </a>
        </div>
      </div>
    </footer>
  )
}
