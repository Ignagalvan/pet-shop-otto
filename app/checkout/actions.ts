'use server'

import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const checkoutSchema = z
  .object({
    checkoutKey: z.uuid(),
    customer: z.object({
      name: z.string().trim().min(2).max(120),
      phone: z.string().trim().min(6).max(40),
      email: z.email().max(180),
      pet: z.string().trim().max(80).optional(),
    }),
    delivery: z.object({
      type: z.enum(['envio', 'retiro']),
      address: z.string().trim().max(180).optional(),
      city: z.string().trim().max(100).optional(),
      postalCode: z.string().trim().max(20).optional(),
      notes: z.string().trim().max(500).optional(),
    }),
    paymentMethod: z.enum(['local', 'transferencia', 'entrega']),
    items: z
      .array(
        z.object({
          variantId: z.uuid(),
          mode: z.enum(['package', 'kg']),
          quantity: z.number().positive().max(1000),
        }),
      )
      .min(1)
      .max(50),
  })
  .superRefine((order, context) => {
    if (
      order.paymentMethod === 'local' &&
      order.delivery.type !== 'retiro'
    ) {
      context.addIssue({
        code: 'custom',
        path: ['paymentMethod'],
        message: 'El pago en el local requiere retiro.',
      })
    }
    if (
      order.paymentMethod === 'entrega' &&
      order.delivery.type !== 'envio'
    ) {
      context.addIssue({
        code: 'custom',
        path: ['paymentMethod'],
        message: 'El pago al recibir requiere envío.',
      })
    }
  })

export type CheckoutInput = z.infer<typeof checkoutSchema>

type CreatedOrder = {
  id: string
  orderNumber: string
  status: string
  subtotal: number
  shipping: number
  total: number
}

export type CheckoutResult =
  | {
      ok: true
      order: CreatedOrder
    }
  | { ok: false; error: string }

export async function createOrderAction(input: CheckoutInput): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input)

  if (!parsed.success) {
    return {
      ok: false,
      error: 'Revisá los datos del pedido e intentá nuevamente.',
    }
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.rpc('create_public_order', {
    p_checkout_key: parsed.data.checkoutKey,
    p_customer: parsed.data.customer,
    p_delivery: parsed.data.delivery,
    p_payment_method: parsed.data.paymentMethod,
    p_items: parsed.data.items,
  })

  if (error) {
    return {
      ok: false,
      error: error.message || 'No pudimos registrar el pedido.',
    }
  }

  const order = data as CreatedOrder

  if (!order?.id || !order.orderNumber) {
    return {
      ok: false,
      error: 'Supabase no devolvió la confirmación del pedido.',
    }
  }

  return {
    ok: true,
    order: {
      ...order,
      subtotal: Number(order.subtotal),
      shipping: Number(order.shipping),
      total: Number(order.total),
    },
  }
}
