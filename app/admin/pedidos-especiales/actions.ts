'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireStaff } from '@/lib/supabase/staff'

const updateSchema = z.object({
  requestId: z.uuid(),
  status: z.enum([
    'new',
    'quoted',
    'awaiting_deposit',
    'deposit_paid',
    'ordered',
    'received',
    'delivered',
    'cancelled',
  ]),
  quotedAmount: z.union([z.literal(''), z.coerce.number().min(0)]),
  depositAmount: z.union([z.literal(''), z.coerce.number().min(0)]),
})

export async function updateSpecialOrderAction(formData: FormData) {
  const parsed = updateSchema.safeParse({
    requestId: formData.get('requestId'),
    status: formData.get('status'),
    quotedAmount: String(formData.get('quotedAmount') ?? '').trim(),
    depositAmount: String(formData.get('depositAmount') ?? '').trim(),
  })

  if (!parsed.success) {
    return { ok: false, error: 'Revisá el estado y los importes.' }
  }

  const { supabase, profile } = await requireStaff()
  if (!profile) {
    return { ok: false, error: 'No tenés permiso para actualizar solicitudes.' }
  }

  const { error } = await supabase
    .from('special_orders')
    .update({
      status: parsed.data.status,
      quoted_amount:
        parsed.data.quotedAmount === '' ? null : parsed.data.quotedAmount,
      deposit_amount:
        parsed.data.depositAmount === '' ? null : parsed.data.depositAmount,
    })
    .eq('id', parsed.data.requestId)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/pedidos-especiales')
  revalidatePath('/admin/historial')
  return { ok: true }
}
