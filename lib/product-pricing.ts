export const roundingSteps = [1, 10, 50, 100, 500, 1000] as const
export const MAX_PRODUCT_PRICE = 100_000_000

export function pricingNumber(value: string): number | null {
  if (!value.trim()) return null
  const number = Number(value.replace(',', '.'))
  return Number.isFinite(number) && number >= 0 ? number : null
}

// Integer arithmetic prevents floating-point errors from adding an extra step
// when a calculated amount is already an exact multiple (e.g. $13,500).
export function calculateSalePrice(cost: number, markup: number, step: number, weightKg?: number): number | null {
  if (![cost, markup, step].every(Number.isFinite) || cost < 0 || cost > MAX_PRODUCT_PRICE || markup < 0 || markup > 10000 || !roundingSteps.some(value => value === step)) return null
  if (weightKg !== undefined && (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 1000000)) return null
  const cents = Math.round(cost * 100)
  const basisPoints = Math.round(markup * 100)
  const grams = weightKg === undefined ? 1000 : Math.round(weightKg * 1000)
  if (grams <= 0) return null
  const numerator = BigInt(cents) * BigInt(10000 + basisPoints) * BigInt(1000)
  const denominator = BigInt(10000) * BigInt(100) * BigInt(step) * BigInt(grams)
  const result = Number((numerator + denominator - BigInt(1)) / denominator) * step
  return result <= MAX_PRODUCT_PRICE ? result : null
}

export function roundCashPrice(price: number, step: number): number | null {
  return calculateSalePrice(price, 0, step)
}
