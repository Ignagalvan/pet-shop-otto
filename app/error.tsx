'use client'

import Link from 'next/link'
import { CircleAlert, RotateCcw } from 'lucide-react'
import { BRAND_FULL_NAME } from '@/lib/data'

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <span className="flex size-20 items-center justify-center rounded-full bg-promo/10 text-promo">
        <CircleAlert className="size-9" />
      </span>
      <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.18em] text-brown">
        {BRAND_FULL_NAME}
      </p>
      <h1 className="mt-2 text-3xl font-extrabold">No pudimos cargar esta página</h1>
      <p className="mt-3 text-muted-foreground">
        Ocurrió un inconveniente temporal. Podés volver a intentarlo o regresar al inicio.
      </p>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <button onClick={reset} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-sm font-bold text-white">
          <RotateCcw className="size-4" /> Reintentar
        </button>
        <Link href="/" className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-card px-6 text-sm font-bold">
          Ir a Pet Shop Otto
        </Link>
      </div>
    </section>
  )
}
