'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, LoaderCircle, Save } from 'lucide-react'
import { updateSpecialOrderAction } from '@/app/admin/pedidos-especiales/actions'

const statuses = [
  ['new', 'Nueva'],
  ['quoted', 'Cotizada'],
  ['awaiting_deposit', 'Esperando seña'],
  ['deposit_paid', 'Seña pagada'],
  ['ordered', 'Producto encargado'],
  ['received', 'Recibido en el local'],
  ['delivered', 'Entregado'],
  ['cancelled', 'Cancelado'],
] as const

export function SpecialOrderStatusForm({
  requestId,
  status,
  quotedAmount,
  depositAmount,
}: {
  requestId: string
  status: string
  quotedAmount: number | null
  depositAmount: number | null
}) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState('')

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      const result = await updateSpecialOrderAction(formData)
      setMessage(
        result.ok
          ? 'Cambios guardados.'
          : result.error ?? 'No pudimos guardar los cambios.',
      )
    })
  }

  return (
    <form onSubmit={submit} className="grid min-w-0 gap-3 sm:grid-cols-3">
      <input type="hidden" name="requestId" value={requestId} />
      <label className="text-xs font-bold text-muted-foreground">
        Estado
        <select
          name="status"
          defaultValue={status}
          className="mt-1 h-10 w-full rounded-xl border bg-white px-3 text-sm font-bold text-foreground"
        >
          {statuses.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs font-bold text-muted-foreground">
        Precio cotizado
        <input
          name="quotedAmount"
          type="number"
          min="0"
          step="0.01"
          defaultValue={quotedAmount ?? ''}
          placeholder="$"
          className="mt-1 h-10 w-full rounded-xl border bg-white px-3 text-sm font-bold text-foreground"
        />
      </label>
      <label className="text-xs font-bold text-muted-foreground">
        Seña requerida
        <input
          name="depositAmount"
          type="number"
          min="0"
          step="0.01"
          defaultValue={depositAmount ?? ''}
          placeholder="$"
          className="mt-1 h-10 w-full rounded-xl border bg-white px-3 text-sm font-bold text-foreground"
        />
      </label>
      <div className="flex items-center gap-3 sm:col-span-3">
        <button
          disabled={isPending}
          className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-extrabold text-white disabled:opacity-60"
        >
          {isPending ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Guardar
        </button>
        {message && (
          <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
            <CheckCircle2 className="size-4 text-success" />
            {message}
          </span>
        )}
      </div>
    </form>
  )
}
