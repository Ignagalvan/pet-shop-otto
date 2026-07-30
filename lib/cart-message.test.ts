import { describe, expect, it } from 'vitest'
import type { CartItem } from '@/components/store-provider'
import { buildOrderMessage } from './cart-message'

const item: CartItem = {
  key: 'agility-10kg',
  variantLabel: 'Bolsa de 10 kg',
  unitPrice: 81148.5,
  quantity: 2,
  product: {
    id: 'agility-urinary',
    slug: 'agility-gato-urinary-10kg',
    name: 'Agility Gato Urinary',
    brand: 'Agility',
    image: '/agility.webp',
    petTypes: ['gatos'],
    category: 'alimentos',
    presentation: '10 kg',
    price: 81148.5,
    stock: 'disponible',
    lifeStage: 'adulto',
    tags: [],
    rating: 0,
    reviewsCount: 0,
    description: '',
    benefits: [],
    features: [],
  },
}

describe('buildOrderMessage', () => {
  it('genera una orden legible con negritas y espacios para WhatsApp', () => {
    const message = buildOrderMessage([item], {
      orderNumber: 'OTTO-2026-000123',
      customer: {
        name: 'Ana Pérez',
        phone: '3511234567',
        email: 'ana@example.com',
        pet: 'Michi',
      },
      delivery: {
        type: 'envio',
        address: 'Siempre Viva 123',
        city: 'Salsipuedes',
        postalCode: '5113',
        notes: 'Tocar timbre',
      },
      payment: 'Transferencia bancaria',
      subtotal: 162297,
      shipping: 0,
      total: 162297,
    })

    expect(message).toContain('*N.º de pedido:* OTTO-2026-000123')
    expect(message).toContain('👤 *DATOS DEL CLIENTE*')
    expect(message).toContain('*Nombre:* Ana Pérez')
    expect(message).toContain('*1. Agility Gato Urinary*')
    expect(message).toContain('• Presentación: Bolsa de 10 kg')
    expect(message).toContain('*Forma de pago:* Transferencia bancaria')
    expect(message).toContain('*Estado del pago:* Pendiente de confirmación')
    expect(message).toContain('*Envío:* Gratis')
    expect(message).toContain('*TOTAL: $ 162.297*')
    expect(message).toContain('\n\n📍 *ENTREGA*\n')
    expect(message).toContain('\n\n💳 *PAGO Y TOTALES*\n')
  })
})
