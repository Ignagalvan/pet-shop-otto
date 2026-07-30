'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireStaff } from '@/lib/supabase/staff'

export type CustomerNoteState = {
  ok: boolean
  message: string
}

const noteSchema = z.object({
  phoneKey: z.string().regex(/^[0-9]{6,20}$/),
  notes: z.string().trim().max(2000),
})

export async function updateCustomerNoteAction(
  _previousState: CustomerNoteState,
  formData: FormData,
): Promise<CustomerNoteState> {
  const parsed = noteSchema.safeParse({
    phoneKey: formData.get('phoneKey'),
    notes: formData.get('notes'),
  })

  if (!parsed.success) {
    return {
      ok: false,
      message: 'La nota no es válida o supera los 2.000 caracteres.',
    }
  }

  const { supabase, profile, user } = await requireStaff()
  if (!profile) {
    return {
      ok: false,
      message: 'No tenés permiso para editar esta nota.',
    }
  }

  const { error } = await supabase.from('customer_notes').upsert({
    phone_key: parsed.data.phoneKey,
    notes: parsed.data.notes,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  })

  if (error) {
    return {
      ok: false,
      message: error.message || 'No pudimos guardar la nota.',
    }
  }

  revalidatePath(`/admin/clientes/${parsed.data.phoneKey}`)
  return { ok: true, message: 'Nota guardada.' }
}
