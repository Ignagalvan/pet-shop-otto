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
  paymentStatus,
}: {
  orderId: string
  status: OrderStatus
  paymentStatus: 'pending' | 'paid' | 'cancelled'
}) {
  const [state, action, pending] = useActionState(
    async (_state: typeof initialState, formData: FormData) =>
      updateOrderStatusAction(formData),
    initialState,
  )

  function confirmCancellation(event: React.FormEvent<HTMLFormElement>) {
    const form = new FormData(event.currentTarget)
    const nextStatus = String(form.get('status'))
    if (nextStatus !== 'cancelled' || status === 'cancelled') return

    const paymentWarning =
      paymentStatus === 'paid'
        ? '\n\nATENCIÓN: el pago figura como PAGADO. Cancelar devuelve el stock, pero el pago seguirá marcado para que no se pierda el control del dinero.'
        : ''
    if (
      !window.confirm(
        `¿Confirmás la cancelación? El stock del pedido volverá al inventario.${paymentWarning}`,
      )
    ) {
      event.preventDefault()
    }
  }

  return (
    <form
      action={action}
      onSubmit={confirmCancellation}
      className="flex flex-wrap items-center gap-2"
    >
      <input type="hidden" name="orderId" value={orderId} />
      <select
        key={status}
        name="status"
        defaultValue={status}
        disabled={pending}
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
        disabled={pending}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-extrabold text-white disabled:opacity-45"
      >
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
        Guardar
      </button>
      {status === 'cancelled' && !state.error && !state.ok && (
        <p className="basis-full text-xs font-bold text-muted-foreground">
          Podés reactivar el pedido. Antes de guardarlo verificaremos que haya
          stock disponible.
        </p>
      )}
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
