'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

const COMPACT_FOOTER_ROUTES = new Set(['/contacto', '/ayuda', '/pedidos-especiales'])

type SiteFooterVisibilityProps = {
  full: ReactNode
  compact: ReactNode
}

export function SiteFooterVisibility({ full, compact }: SiteFooterVisibilityProps) {
  const pathname = usePathname()

  if (pathname === '/') return full
  if (COMPACT_FOOTER_ROUTES.has(pathname)) return compact

  return null
}
