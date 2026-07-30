import { describe, expect, it } from 'vitest'
import { formatBusinessHours, getBusinessStatus } from './business-hours'
import {
  DEFAULT_STORE_SETTINGS,
  calculateShipping,
  parseStoreSettings,
} from './store-settings'

describe('store settings', () => {
  it('calcula el envío con el costo y mínimo configurados', () => {
    expect(calculateShipping(20_000, DEFAULT_STORE_SETTINGS)).toBe(4500)
    expect(calculateShipping(40_000, DEFAULT_STORE_SETTINGS)).toBe(0)
    expect(
      calculateShipping(20_000, DEFAULT_STORE_SETTINGS, 'retiro'),
    ).toBe(0)
  })

  it('normaliza datos inválidos sin romper la tienda', () => {
    const parsed = parseStoreSettings({
      whatsapp_number: '+54 9 351 123 4567',
      shipping_cost: -1,
      payment_methods: ['transferencia', 'desconocido'],
      business_hours: null,
    })

    expect(parsed.whatsappNumber).toBe('5493511234567')
    expect(parsed.shippingCost).toBe(4500)
    expect(parsed.paymentMethods).toEqual(['transferencia'])
    expect(parsed.businessHours.days).toHaveLength(7)
  })

  it('detecta apertura y próxima atención en horario de Córdoba', () => {
    const mondayMorning = new Date('2026-07-27T12:00:00.000Z')
    const sundayMorning = new Date('2026-07-26T12:00:00.000Z')

    expect(
      getBusinessStatus(
        DEFAULT_STORE_SETTINGS.businessHours,
        mondayMorning,
      ).isOpen,
    ).toBe(true)
    expect(
      getBusinessStatus(
        DEFAULT_STORE_SETTINGS.businessHours,
        sundayMorning,
      ).nextOpening,
    ).toContain('mañana')
  })

  it('resume los días que comparten horario', () => {
    expect(
      formatBusinessHours(DEFAULT_STORE_SETTINGS.businessHours),
    ).toContain('lunes a sábado')
  })
})

