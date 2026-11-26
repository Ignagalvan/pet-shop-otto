import { describe, expect, it } from 'vitest'
import { calculateSalePrice, pricingNumber, roundCashPrice } from './product-pricing'

describe('precios con recargo sobre costo y redondeo siempre hacia arriba', () => {
  it('recalcula al cambiar costo o porcentaje', () => {
    expect(calculateSalePrice(10000.25, 35, 100)).toBe(13600)
    expect(calculateSalePrice(10001, 35, 100)).toBe(13600)
    expect(calculateSalePrice(10001, 40, 100)).toBe(14100)
  })
  it('no suma un escalón extra cuando ya es exacto', () => {
    expect(calculateSalePrice(10000, 35, 100)).toBe(13500)
    expect(calculateSalePrice(0.1, 0, 1)).toBe(1)
    expect(roundCashPrice(87000, 1000)).toBe(87000)
  })
  it('calcula el kilo desde el costo de la bolsa, no desde su precio de venta', () => {
    expect(calculateSalePrice(64510, 60, 100, 10)).toBe(10400)
    expect(calculateSalePrice(64510, 60, 50, 10)).toBe(10350)
    expect(calculateSalePrice(10000, 50, 10, 7.5)).toBe(2000)
  })
  it('permite costo o porcentaje cero, pero rechaza datos inválidos', () => {
    expect(calculateSalePrice(100, 0, 1)).toBe(100)
    expect(calculateSalePrice(0, 50, 100)).toBe(0)
    for (const cost of [-1, Infinity, NaN, 100000001]) expect(calculateSalePrice(cost, 35, 100)).toBeNull()
    expect(calculateSalePrice(100, -1, 100)).toBeNull()
    expect(calculateSalePrice(100, 30, 3)).toBeNull()
    expect(calculateSalePrice(100, 30, 100, 0)).toBeNull()
    expect(calculateSalePrice(100000000, 100, 100)).toBeNull()
  })
  it('acepta coma decimal y no interpreta un campo vacío como cero', () => {
    expect(pricingNumber('100,25')).toBe(100.25)
    expect(pricingNumber('')).toBeNull()
    expect(pricingNumber('abc')).toBeNull()
  })
})
