'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronsLeft,
  ChevronsRight,
  PawPrint,
} from 'lucide-react'
import { useTransition } from 'react'

type ProductPaginationProps = {
  currentPage: number
  totalPages: number
  query: string
  status: string
}

function buildPageHref(query: string, status: string, page: number) {
  const params = new URLSearchParams()
  if (query) params.set('q', query)
  if (status !== 'todos') params.set('estado', status)
  if (page > 1) params.set('pagina', String(page))
  const suffix = params.toString()
  return `/admin/productos${suffix ? `?${suffix}` : ''}`
}

function visiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages = new Set([
    1,
    totalPages,
    currentPage - 2,
    currentPage - 1,
    currentPage,
    currentPage + 1,
    currentPage + 2,
  ])

  return [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b)
}

export function ProductPagination({
  currentPage,
  totalPages,
  query,
  status,
}: ProductPaginationProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const pages = visiblePages(currentPage, totalPages)

  function goToPage(page: number) {
    startTransition(() => {
      router.push(buildPageHref(query, status, page))
    })
  }

  const navigationClass =
    'inline-flex size-10 items-center justify-center rounded-xl border bg-white text-primary transition hover:border-primary/35 hover:bg-primary/5'

  return (
    <div
      className={`mt-5 rounded-2xl border bg-white p-3 shadow-sm transition ${
        isPending ? 'opacity-70' : ''
      }`}
      aria-label="Paginación de productos"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Página <strong className="text-foreground">{currentPage}</strong> de{' '}
          <strong className="text-foreground">{totalPages}</strong>
        </p>

        <div className="flex items-center gap-1.5">
          <Link
            href={buildPageHref(query, status, 1)}
            aria-label="Ir a la primera página"
            aria-disabled={currentPage === 1}
            className={`${navigationClass} ${
              currentPage === 1 ? 'pointer-events-none opacity-35' : ''
            }`}
          >
            <ChevronsLeft className="size-4" />
          </Link>

          <Link
            href={buildPageHref(query, status, Math.max(currentPage - 1, 1))}
            aria-label="Ir a la página anterior"
            aria-disabled={currentPage === 1}
            className={`${navigationClass} ${
              currentPage === 1 ? 'pointer-events-none opacity-35' : ''
            }`}
          >
            <PawPrint className="size-4 -rotate-45" />
          </Link>

          <div className="hidden items-center gap-1.5 sm:flex">
            {pages.map((page, index) => {
              const previousPage = pages[index - 1]
              const hasGap = previousPage !== undefined && page - previousPage > 1

              return (
                <div key={page} className="flex items-center gap-1.5">
                  {hasGap && <span className="px-1 text-muted-foreground">…</span>}
                  <Link
                    href={buildPageHref(query, status, page)}
                    aria-current={page === currentPage ? 'page' : undefined}
                    className={`relative inline-flex size-10 items-center justify-center rounded-xl border text-sm font-extrabold transition ${
                      page === currentPage
                        ? 'border-primary bg-primary text-white shadow-sm'
                        : 'bg-white hover:border-primary/35 hover:bg-primary/5'
                    }`}
                  >
                    {page}
                    {page === currentPage && (
                      <PawPrint className="absolute -right-1 -top-1 size-3 rounded-full bg-success p-0.5 text-white" />
                    )}
                  </Link>
                </div>
              )
            })}
          </div>

          <Link
            href={buildPageHref(
              query,
              status,
              Math.min(currentPage + 1, totalPages),
            )}
            aria-label="Ir a la página siguiente"
            aria-disabled={currentPage === totalPages}
            className={`${navigationClass} ${
              currentPage === totalPages ? 'pointer-events-none opacity-35' : ''
            }`}
          >
            <PawPrint className="size-4 rotate-[135deg]" />
          </Link>

          <Link
            href={buildPageHref(query, status, totalPages)}
            aria-label="Ir a la última página"
            aria-disabled={currentPage === totalPages}
            className={`${navigationClass} ${
              currentPage === totalPages ? 'pointer-events-none opacity-35' : ''
            }`}
          >
            <ChevronsRight className="size-4" />
          </Link>
        </div>

        <label className="flex items-center gap-2 text-sm font-bold">
          Ir a
          <select
            value={currentPage}
            onChange={(event) => goToPage(Number(event.target.value))}
            className="h-10 rounded-xl border bg-background px-3 outline-none focus:border-primary"
          >
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <option key={page} value={page}>
                  Página {page}
                </option>
              ),
            )}
          </select>
        </label>
      </div>
    </div>
  )
}
