export function formatPrice(value: number): string {
  return '$ ' + value.toLocaleString('es-AR', { maximumFractionDigits: 0 })
}

export function discountPercent(price: number, oldPrice?: number): number | null {
  if (!oldPrice || oldPrice <= price) return null
  return Math.round(((oldPrice - price) / oldPrice) * 100)
}
