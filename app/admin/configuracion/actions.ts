'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { z } from 'zod'
import { requireStaff } from '@/lib/supabase/staff'
import {
  PAYMENT_METHODS,
  normalizeInstagram,
  normalizeWhatsappNumber,
  type BusinessDay,
  type PaymentMethod,
} from '@/lib/store-settings'

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
  closedStoreMessage: z.string().trim().min(10).max(280),
})

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

function readHours(formData: FormData) {
  const days: BusinessDay[] = []

  for (let day = 0; day < 7; day += 1) {
    const enabled = formData.get(`day-${day}-enabled`) === 'on'
    const firstStart = String(formData.get(`day-${day}-start-1`) ?? '')
    const firstEnd = String(formData.get(`day-${day}-end-1`) ?? '')
    const secondStart = String(formData.get(`day-${day}-start-2`) ?? '')
    const secondEnd = String(formData.get(`day-${day}-end-2`) ?? '')
    const shifts = []

    if (enabled) {
      if (
        !TIME_PATTERN.test(firstStart) ||
        !TIME_PATTERN.test(firstEnd) ||
        firstStart >= firstEnd
      ) {
        throw new Error('Revisá el primer horario de cada día habilitado.')
      }
      shifts.push({ start: firstStart, end: firstEnd })

      if (secondStart || secondEnd) {
        if (
          !TIME_PATTERN.test(secondStart) ||
          !TIME_PATTERN.test(secondEnd) ||
          secondStart >= secondEnd ||
          firstEnd > secondStart
        ) {
          throw new Error(
            'Revisá el segundo horario: debe estar completo y no superponerse.',
          )
        }
        shifts.push({ start: secondStart, end: secondEnd })
      }
    }

    days.push({ day, enabled, shifts })
  }

  return {
    timeZone: 'America/Argentina/Cordoba',
    days,
  }
}

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

  let businessHours
  try {
    businessHours = readHours(formData)
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
