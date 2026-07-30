'use client'

import { Save, StickyNote } from 'lucide-react'
import { useActionState } from 'react'
import {
  updateCustomerNoteAction,
  type CustomerNoteState,
} from '@/app/admin/clientes/actions'

const initialState: CustomerNoteState = {
  ok: false,
  message: '',
}

export function CustomerNoteForm({
  phoneKey,
  notes,
}: {
  phoneKey: string
  notes: string
}) {
  const [state, formAction, pending] = useActionState(
    updateCustomerNoteAction,
    initialState,
  )

  return (
    <form action={formAction} className="rounded-2xl border bg-white p-5 shadow-sm">
      <input type="hidden" name="phoneKey" value={phoneKey} />
      <h2 className="flex items-center gap-2 text-lg font-extrabold">
        <StickyNote className="size-5 text-brown" />
        Nota interna
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Solo la ve el equipo del negocio.
      </p>
      <textarea
        name="notes"
        defaultValue={notes}
        maxLength={2000}
        rows={5}
        placeholder="Ej.: prefiere que lo llamen por la tarde, su mascota tiene una dieta especial…"
        className="mt-4 w-full resize-y rounded-xl border bg-background p-3 text-sm outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p
          aria-live="polite"
          className={`text-sm ${
            state.ok ? 'text-success' : 'text-destructive'
          }`}
        >
          {state.message}
        </p>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white disabled:opacity-60"
        >
          <Save className="size-4" />
          {pending ? 'Guardando…' : 'Guardar nota'}
        </button>
      </div>
    </form>
  )
}
