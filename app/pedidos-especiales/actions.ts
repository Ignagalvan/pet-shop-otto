'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

const allowedFileTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
])

const specialOrderSchema = z.object({
  name: z.string().trim().min(2).max(160),
  phone: z.string().trim().min(6).max(40),
  product: z.string().trim().min(2).max(240),
  petType: z.string().trim().min(2).max(80),
  quantity: z.coerce.number().int().min(1).max(999),
  details: z.string().trim().max(2000),
})

export type CreateSpecialOrderResult =
  | {
      ok: true
      requestNumber: string
      whatsappMessage: string
    }
  | {
      ok: false
      error: string
    }

export async function createSpecialOrderAction(
  formData: FormData,
): Promise<CreateSpecialOrderResult> {
  const parsed = specialOrderSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    product: formData.get('product'),
    petType: formData.get('petType'),
    quantity: formData.get('quantity'),
    details: formData.get('details'),
  })

  if (!parsed.success) {
    return {
      ok: false,
      error: 'Revisá tus datos, el producto y la cantidad antes de enviar.',
    }
  }

  const file = formData.get('reference')
  const hasFile = file instanceof File && file.size > 0
  if (hasFile && (file.size > 5 * 1024 * 1024 || !allowedFileTypes.has(file.type))) {
    return {
      ok: false,
      error: 'La referencia debe ser una imagen o PDF de hasta 5 MB.',
    }
  }

  const supabase = createSupabaseAdminClient()
  const { data: request, error: insertError } = await supabase
    .from('special_orders')
    .insert({
      customer_name: parsed.data.name,
      customer_phone: parsed.data.phone,
      product_name: parsed.data.product,
      pet_type: parsed.data.petType,
      quantity: parsed.data.quantity,
      details: parsed.data.details,
    })
    .select('id, request_number')
    .single()

  if (insertError || !request) {
    return {
      ok: false,
      error: 'No pudimos registrar la solicitud. Intentá nuevamente.',
    }
  }

  let referenceUrl = ''
  if (hasFile) {
    const extension =
      file.type === 'application/pdf'
        ? 'pdf'
        : file.type === 'image/png'
          ? 'png'
          : file.type === 'image/webp'
            ? 'webp'
            : 'jpg'
    const path = `${request.id}/${crypto.randomUUID()}.${extension}`
    const { error: uploadError } = await supabase.storage
      .from('special-order-files')
      .upload(path, file, { contentType: file.type, upsert: false })

    if (uploadError) {
      await supabase.from('special_orders').delete().eq('id', request.id)
      return {
        ok: false,
        error: 'No pudimos guardar la foto de referencia. Intentá nuevamente.',
      }
    }

    referenceUrl = supabase.storage
      .from('special-order-files')
      .getPublicUrl(path).data.publicUrl

    const { error: updateError } = await supabase
      .from('special_orders')
      .update({ reference_url: referenceUrl })
      .eq('id', request.id)

    if (updateError) {
      await supabase.storage.from('special-order-files').remove([path])
      await supabase.from('special_orders').delete().eq('id', request.id)
      return {
        ok: false,
        error: 'No pudimos completar la solicitud. Intentá nuevamente.',
      }
    }
  }

  const requestNumber = `ESP-${String(request.request_number).padStart(5, '0')}`
  const whatsappMessage = [
    '🐾 *NUEVA SOLICITUD A PEDIDO — PET SHOP OTTO*',
    `*N.º de solicitud:* ${requestNumber}`,
    '',
    '👤 *DATOS DEL CLIENTE*',
    `*Nombre:* ${parsed.data.name}`,
    `*WhatsApp:* ${parsed.data.phone}`,
    '',
    '📦 *PRODUCTO SOLICITADO*',
    `*Producto o marca:* ${parsed.data.product}`,
    `*Mascota:* ${parsed.data.petType}`,
    `*Cantidad:* ${parsed.data.quantity}`,
    ...(parsed.data.details
      ? [`*Detalles:* ${parsed.data.details}`]
      : []),
    ...(referenceUrl ? [`*Foto o referencia:* ${referenceUrl}`] : []),
    '',
    '*Estado:* Pendiente de cotización',
    'Quedo a la espera del precio, plazo estimado y seña necesaria.',
  ].join('\n')

  revalidatePath('/admin/pedidos-especiales')
  revalidatePath('/admin/historial')

  return { ok: true, requestNumber, whatsappMessage }
}
