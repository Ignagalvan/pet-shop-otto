'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireStaff } from '@/lib/supabase/staff'

const statusSchema = z.object({
  orderId: z.uuid(),
  status: z.enum([
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'completed',
    'cancelled',
  ]),
})

export async function updateOrderStatusAction(formData: FormData) {
  const parsed = statusSchema.safeParse({
    orderId: formData.get('orderId'),
    status: formData.get('status'),
  })

  if (!parsed.success) {
    return { ok: false, error: 'El estado seleccionado no es válido.' }
  }

  const { supabase, profile } = await requireStaff()
  if (!profile) {
    return { ok: false, error: 'No tenés permiso para actualizar pedidos.' }
  }

  const { error } = await supabase.rpc('update_order_status', {
    p_order_id: parsed.data.orderId,
    p_status: parsed.data.status,
  })

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/pedidos')
  revalidatePath('/admin/productos')
  revalidatePath('/productos')

  return { ok: true }
}
