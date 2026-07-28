import Link from 'next/link'
import { BRAND_FULL_NAME } from '@/lib/data'

export function CompactSiteFooter() {
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
            href="https://www.instagram.com/pet_shop.otto/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand hover:underline"
          >
            @pet_shop.otto
          </a>
        </div>
      </div>
    </footer>
  )
}
