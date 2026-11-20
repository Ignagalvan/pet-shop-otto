import { describe, expect, it } from 'vitest'
import { formatPrice } from './format'

describe('money display', () => {
  it('preserves cents instead of rounding the amount to whole pesos', () => {
    expect(formatPrice(81148.5)).toBe('$ 81.148,5')
    expect(formatPrice(1234.56)).toBe('$ 1.234,56')
    expect(formatPrice(4500)).toBe('$ 4.500')
  })
})
