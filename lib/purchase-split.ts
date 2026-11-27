export function splitPurchase(requested: number, stock: number, inCart = 0, loose = false) {
  const available = Math.max(0, loose ? Math.round((stock - inCart) * 1000) / 1000 : Math.floor(stock - inCart))
  const valid = Number.isFinite(requested) && requested > 0 && (loose ? Math.abs(requested * 1000 - Math.round(requested * 1000)) < 0.000001 : Number.isInteger(requested))
  const purchase = valid ? Math.min(requested, available) : 0
  return {available, purchase, missing: valid ? Math.round((requested - purchase) * 1000) / 1000 : 0, valid}
}

export function specialOrderLink(name: string, presentation: string, missing: number, loose: boolean) {
  const amount = missing > 0 ? missing : 1
  const amountLabel = `${amount.toLocaleString('es-AR')} ${loose ? 'kg sueltos' : 'bolsa(s) / unidad(es)'}`
  const product = `${name} — ${presentation}${loose ? ` (${amountLabel})` : ''}`.slice(0, 240)
  const params = new URLSearchParams({producto: product, cantidad: String(loose ? 1 : Math.min(999, amount)), detalle: `Encargo de ${amountLabel} de ${name}, ${presentation}. Solo se solicita el faltante; la compra de stock disponible se realiza por separado. Precio y entrega a confirmar.`.slice(0, 2000)})
  return `/pedidos-especiales?${params}`
}
