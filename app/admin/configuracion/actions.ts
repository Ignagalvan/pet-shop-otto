'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { z } from 'zod'
import { requireStaff } from '@/lib/supabase/staff'
import {
  PAYMENT_METHODS,
  hasValidTransferDetails,
  normalizeInstagram,
  normalizeWhatsappNumber,
  type PaymentMethod,
} from '@/lib/store-settings'
import { readBusinessHoursForm } from '@/lib/business-hours-form'

export type SettingsActionState = {
  ok: boolean
  message: string
}

const settingsSchema = z.object({
  instagram: z.string().trim().max(80),
  whatsappNumber: z.string().regex(/^\d{10,15}$/),
  address: z.string().trim().min(5).max(240),
  email: z.union([z.literal(''), z.email()]),
  shippingCost: z.coerce.number().min(0).max(10_000_000),
  freeShippingThreshold: z.union([
    z.literal(''),
    z.coerce.number().positive().max(100_000_000),
  ]),
  transferAlias: z.string().trim().max(120),
  transferHolder: z.string().trim().max(160),
  transferBank: z.string().trim().max(120),
  transferCbu: z.string().trim().max(40),
  transferInstructions: z.string().trim().max(280),
  closedStoreMessage: z.string().trim().min(10).max(280),
})

export async function updateStoreSettingsAction(
  _previousState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = settingsSchema.safeParse({
    instagram: normalizeInstagram(String(formData.get('instagram') ?? '')),
    whatsappNumber: normalizeWhatsappNumber(
      String(formData.get('whatsappNumber') ?? ''),
    ),
    address: formData.get('address'),
    email: String(formData.get('email') ?? '').trim(),
    shippingCost: formData.get('shippingCost'),
    freeShippingThreshold: String(
      formData.get('freeShippingThreshold') ?? '',
    ).trim(),
    transferAlias: formData.get('transferAlias'),
    transferHolder: formData.get('transferHolder'),
    transferBank: formData.get('transferBank'),
    transferCbu: formData.get('transferCbu'),
    transferInstructions: formData.get('transferInstructions'),
    closedStoreMessage: formData.get('closedStoreMessage'),
  })

  if (!parsed.success) {
    return {
      ok: false,
      message:
        'Revisá los datos de contacto y los importes antes de guardar.',
    }
  }

  const deliveryEnabled = formData.get('deliveryEnabled') === 'on'
  const pickupEnabled = formData.get('pickupEnabled') === 'on'
  if (!deliveryEnabled && !pickupEnabled) {
    return {
      ok: false,
      message: 'Habilitá al menos una forma de entrega.',
    }
  }

  const paymentMethods = formData
    .getAll('paymentMethod')
    .map(String)
    .filter((method): method is PaymentMethod =>
      PAYMENT_METHODS.includes(method as PaymentMethod),
    )

  if (!paymentMethods.length) {
    return {
      ok: false,
      message: 'Habilitá al menos una forma de pago.',
    }
  }

  if (
    paymentMethods.includes('transferencia') &&
    (parsed.data.transferAlias !== '' || parsed.data.transferCbu !== '') &&
    !hasValidTransferDetails(parsed.data)
  ) {
    return {
      ok: false,
      message:
        'Para habilitar transferencias, completá el titular y un alias o CBU/CVU válido.',
    }
  }

  if (
    deliveryEnabled &&
    !paymentMethods.some(
      (method) => method === 'transferencia' || method === 'entrega',
    )
  ) {
    return {
      ok: false,
      message:
        'Para ofrecer envíos, habilitá transferencia o pago al recibir.',
    }
  }

  if (
    pickupEnabled &&
    !paymentMethods.some(
      (method) => method === 'transferencia' || method === 'local',
    )
  ) {
    return {
      ok: false,
      message:
        'Para ofrecer retiro, habilitá transferencia o pago en el local.',
    }
  }

  let businessHours
  try {
    businessHours = readBusinessHoursForm(formData)
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : 'Revisá los horarios.',
    }
  }

  const { supabase, profile } = await requireStaff()
  if (!profile) {
    return {
      ok: false,
      message: 'No tenés permiso para modificar la configuración.',
    }
  }

  const { error } = await supabase.from('store_settings').upsert({
    id: true,
    instagram: parsed.data.instagram,
    whatsapp_number: parsed.data.whatsappNumber,
    address: parsed.data.address,
    email: parsed.data.email || null,
    business_hours: businessHours,
    delivery_enabled: deliveryEnabled,
    pickup_enabled: pickupEnabled,
    shipping_cost: parsed.data.shippingCost,
    free_shipping_threshold:
      parsed.data.freeShippingThreshold === ''
        ? null
        : parsed.data.freeShippingThreshold,
    payment_methods: paymentMethods,
    transfer_alias: parsed.data.transferAlias,
    transfer_holder: parsed.data.transferHolder,
    transfer_bank: parsed.data.transferBank,
    transfer_cbu: parsed.data.transferCbu,
    transfer_instructions: parsed.data.transferInstructions,
    closed_store_message: parsed.data.closedStoreMessage,
    updated_at: new Date().toISOString(),
  })

  if (error) {
    return {
      ok: false,
      message: error.message || 'No pudimos guardar la configuración.',
    }
  }

  revalidatePath('/', 'layout')
  revalidatePath('/admin/configuracion')
  updateTag('store-settings')

  return {
    ok: true,
    message: 'Configuración guardada y aplicada en toda la tienda.',
  }
}
