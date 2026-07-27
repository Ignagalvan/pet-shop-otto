'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

const FOOTER_ROUTES = new Set([
  '/',
  '/productos',
  '/contacto',
  '/ayuda',
  '/pedidos-especiales',
])

type SiteFooterVisibilityProps = {
  children: ReactNode
}

export function SiteFooterVisibility({ children }: SiteFooterVisibilityProps) {
  const pathname = usePathname()

  if (!FOOTER_ROUTES.has(pathname)) return null

  return children
}
