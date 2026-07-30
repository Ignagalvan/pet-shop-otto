'use client'

import { useActionState } from 'react'
import { BadgeDollarSign, LoaderCircle } from 'lucide-react'
import { updatePaymentStatusAction } from '@/app/admin/pedidos/actions'

export type PaymentStatus = 'pending' | 'paid' | 'cancelled'

const initialState: { ok?: boolean; error?: string } = {}

export function PaymentStatusForm({
  orderId,
  status,
}: {
  orderId: string
  status: PaymentStatus
}) {
  const [state, action, pending] = useActionState(
    async (_state: typeof initialState, formData: FormData) =>
      updatePaymentStatusAction(formData),
    initialState,
  )

  return (
    <form action={action} className="mt-3 rounded-xl border bg-white p-3">
      <label className="text-xs font-extrabold text-muted-foreground">
        Estado del pago
        <span className="mt-2 flex gap-2">
          <input type="hidden" name="orderId" value={orderId} />
          <select
            key={status}
            name="paymentStatus"
            defaultValue={status}
            disabled={pending}
            className="h-10 min-w-0 flex-1 rounded-lg border bg-background px-2 text-sm font-bold text-foreground outline-none focus:border-primary"
          >
            <option value="pending">Pendiente</option>
            <option value="paid">Pagado</option>
            <option value="cancelled">Pago cancelado</option>
          </select>
          <button
            disabled={pending}
            aria-label="Guardar estado del pago"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-success text-white disabled:opacity-50"
          >
            {pending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <BadgeDollarSign className="size-4" />
            )}
          </button>
        </span>
      </label>
      {state.error ? (
        <p role="alert" className="mt-2 text-xs font-bold text-destructive">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="mt-2 text-xs font-bold text-success">
          Pago actualizado.
        </p>
      ) : null}
    </form>
  )
}
