import type { CartItem } from '@/components/store-provider'
import { formatPrice } from './format'
import { BRAND_FULL_NAME } from './data'

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
  subtotal: number
  shipping: number
  total: number
}

export function buildOrderMessage(items: CartItem[], order: OrderMessageData): string {
  const deliveryLines =
    order.delivery.type === 'envio'
      ? [
          'Entrega: Envío a domicilio',
          `Dirección: ${order.delivery.address}`,
          `Localidad: ${order.delivery.city}`,
          `Código postal: ${order.delivery.postalCode}`,
          order.delivery.notes ? `Indicaciones: ${order.delivery.notes}` : '',
        ]
      : ['Entrega: Retiro en el local']

  return [
    `NUEVO PEDIDO — ${BRAND_FULL_NAME.toUpperCase()}`,
    `Pedido: ${order.orderNumber}`,
    '',
    'DATOS DEL CLIENTE',
    `Nombre: ${order.customer.name}`,
    `WhatsApp: ${order.customer.phone}`,
    `Email: ${order.customer.email}`,
    order.customer.pet ? `Mascota: ${order.customer.pet}` : '',
    '',
    'ENTREGA',
    ...deliveryLines,
    '',
    'PRODUCTOS',
    ...items.map(
      (item) =>
        `• ${item.quantity}x ${item.product.name}${
          item.variantLabel ? ` (${item.variantLabel})` : ` (${item.product.presentation})`
        } — ${formatPrice(item.unitPrice * item.quantity)}`,
    ),
    '',
    'PAGO Y TOTALES',
    `Forma de pago: ${order.payment}`,
    `Subtotal: ${formatPrice(order.subtotal)}`,
    `Envío: ${order.shipping === 0 ? 'Gratis' : formatPrice(order.shipping)}`,
    `TOTAL: ${formatPrice(order.total)}`,
    '',
    'Quedo a la espera de la confirmación. ¡Gracias!',
  ]
    .filter(Boolean)
    .join('\n')
}
