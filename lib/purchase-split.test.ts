import { expect, it } from 'vitest'
import { specialOrderLink, splitPurchase } from './purchase-split'

it('separa tres bolsas disponibles de dos por encargar sin vender cinco', () => {
  expect(splitPurchase(5, 3)).toEqual({available:3,purchase:3,missing:2,valid:true})
  expect(splitPurchase(2, 3)).toEqual({available:3,purchase:2,missing:0,valid:true})
  expect(splitPurchase(5, 0).purchase).toBe(0)
})
it('resta lo que ya está en el carrito y respeta kilos/gramos', () => {
  expect(splitPurchase(5, 3, 1)).toEqual({available:2,purchase:2,missing:3,valid:true})
  expect(splitPurchase(0.75, 0.5, 0.1, true)).toEqual({available:0.4,purchase:0.4,missing:0.35,valid:true})
  expect(splitPurchase(0.5, 3).valid).toBe(false)
  expect(splitPurchase(0.0001, 1, 0, true).valid).toBe(false)
})
it('precarga solo el faltante en el encargo sin prometerlo como stock', () => {
  const url=new URL(specialOrderLink('Alimento','10 kg',2,false),'http://example.invalid')
  expect(url.searchParams.get('cantidad')).toBe('2')
  expect(url.searchParams.get('producto')).toBe('Alimento — 10 kg')
  expect(url.searchParams.get('detalle')).toContain('Precio y entrega a confirmar')
  const loose=new URL(specialOrderLink('Alimento','Suelto',0.35,true),'http://example.invalid')
  expect(loose.searchParams.get('producto')).toContain('0,35 kg sueltos')
})
