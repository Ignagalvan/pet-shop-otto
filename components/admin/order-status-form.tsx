'use client'

import { useActionState } from 'react'
import { LoaderCircle, Save } from 'lucide-react'
import { updateOrderStatusAction } from '@/app/admin/pedidos/actions'

type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled'

const initialState: { ok?: boolean; error?: string } = {}

export function OrderStatusForm({
  orderId,
  status,
}: {
  orderId: string
  status: OrderStatus
}) {
  const [state, action, pending] = useActionState(
    async (_state: typeof initialState, formData: FormData) =>
      updateOrderStatusAction(formData),
    initialState,
  )

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="orderId" value={orderId} />
      <select
        key={status}
        name="status"
        defaultValue={status}
        disabled={status === 'cancelled' || pending}
        aria-label="Estado del pedido"
        className="h-10 min-w-40 rounded-xl border bg-background px-3 text-sm font-bold outline-none focus:border-primary"
      >
        <option value="pending">Nuevo</option>
        <option value="confirmed">Confirmado</option>
        <option value="preparing">Preparando</option>
        <option value="ready">Listo</option>
        <option value="completed">Entregado</option>
        <option value="cancelled">Cancelado</option>
      </select>
      <button
        disabled={status === 'cancelled' || pending}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-extrabold text-white disabled:opacity-45"
      >
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
        Guardar
      </button>
      {state.error && (
        <p role="alert" className="basis-full text-xs font-bold text-destructive">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="basis-full text-xs font-bold text-success">
          Estado actualizado.
        </p>
      )}
    </form>
  )
}
