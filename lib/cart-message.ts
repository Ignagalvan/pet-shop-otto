import { formatPrice } from './format'
import { BRAND_FULL_NAME } from './data'

export type OrderMessageItem = {
  productName: string
  presentation?: string | null
  unitPrice: number
  quantity: number
  subtotal: number
}

export interface OrderMessageData {
  orderNumber: string
  customer: {
    name: string
    phone: string
    email: string
    pet?: string
  }
  delivery: {
    type: 'envio' | 'retiro'
    address?: string
    city?: string
    postalCode?: string
    notes?: string
  }
  payment: string
  paymentNote?: string
  subtotal: number
  shipping: number
  total: number
}

export function buildOrderMessage(
  items: OrderMessageItem[],
  order: OrderMessageData,
): string {
  const deliveryLines =
    order.delivery.type === 'envio'
      ? [
          '*Modalidad:* Envío a domicilio',
          `*Dirección:* ${order.delivery.address}`,
          `*Localidad:* ${order.delivery.city}`,
          `*Código postal:* ${order.delivery.postalCode}`,
          ...(order.delivery.notes
            ? [`*Indicaciones:* ${order.delivery.notes}`]
            : []),
        ]
      : ['*Modalidad:* Retiro en el local']

  const productLines = items.flatMap((item, index) => {
    return [
      `*${index + 1}. ${item.productName}*`,
      `• Cantidad: ${item.quantity}${item.presentation?.startsWith('Suelto')?' kg':''}`,
      ...(item.presentation
        ? [`• Presentación: ${item.presentation}`]
        : []),
      `• Precio unitario: ${formatPrice(item.unitPrice)}`,
      `• Subtotal: ${formatPrice(item.subtotal)}`,
      '',
    ]
  })

  return [
    `🐾 *NUEVO PEDIDO — ${BRAND_FULL_NAME.toUpperCase()}*`,
    `*N.º de pedido:* ${order.orderNumber}`,
    '',
    '👤 *DATOS DEL CLIENTE*',
    `*Nombre:* ${order.customer.name}`,
    `*WhatsApp:* ${order.customer.phone}`,
    `*Email:* ${order.customer.email}`,
    ...(order.customer.pet
      ? [`*Mascota:* ${order.customer.pet}`]
      : []),
    '',
    '📍 *ENTREGA*',
    ...deliveryLines,
    '',
    '🛍️ *PRODUCTOS*',
    ...productLines,
    '💳 *PAGO Y TOTALES*',
    `*Forma de pago:* ${order.payment}`,
    '*Estado del pago:* Pendiente de confirmación',
    ...(order.paymentNote ? [`*Importante:* ${order.paymentNote}`] : []),
    '',
    `*Subtotal:* ${formatPrice(order.subtotal)}`,
    `*Envío:* ${
      order.shipping === 0 ? 'Gratis' : formatPrice(order.shipping)
    }`,
    `*TOTAL: ${formatPrice(order.total)}*`,
    '',
    '✅ Quedo a la espera de la confirmación del pedido.',
    '¡Muchas gracias!',
  ].join('\n')
}
