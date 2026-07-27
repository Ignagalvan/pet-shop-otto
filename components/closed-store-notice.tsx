'use client'

import { Clock3, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getBusinessStatus } from '@/lib/business-hours'

type StoreStatus = ReturnType<typeof getBusinessStatus>

export function ClosedStoreNotice() {
  const [status, setStatus] = useState<StoreStatus | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const updateStatus = () => setStatus(getBusinessStatus())

    updateStatus()
    const intervalId = window.setInterval(updateStatus, 60_000)

    return () => window.clearInterval(intervalId)
  }, [])

  if (!status || status.isOpen || dismissed) return null

  return (
    <aside
      role="status"
      aria-live="polite"
      className="border-b border-amber-200 bg-amber-50 text-amber-950"
    >
      <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-3 sm:items-center">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 sm:mt-0">
          <Clock3 className="size-4" aria-hidden="true" />
        </span>
        <p className="min-w-0 flex-1 text-sm leading-5">
          <strong>El local está cerrado en este momento.</strong>{' '}
          Podés hacer tu pedido con normalidad y lo vamos a preparar apenas abramos.{' '}
          <span className="font-bold">{status.nextOpening}</span>
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="flex size-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
          aria-label="Cerrar aviso"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    </aside>
  )
}
