export function toKilograms(value: string, unit: 'kg' | 'g'): number | null {
  if (!value.trim()) return null
  const amount=Number(value.replace(',','.'))
  const kg=unit==='g'?amount/1000:amount
  if (!Number.isFinite(kg)||kg<0.001||kg>1000||Math.abs(kg*1000-Math.round(kg*1000))>0.000001) return null
  return Math.round(kg*1000)/1000
}
export function quantityLabel(quantity:number, mode?:'kg'|'package') {
  return mode==='kg' ? `${new Intl.NumberFormat('es-AR',{maximumFractionDigits:3}).format(quantity)} kg sueltos` : `${quantity} unidad${quantity===1?'':'es'}`
}
