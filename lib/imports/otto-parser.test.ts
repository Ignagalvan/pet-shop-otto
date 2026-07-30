import fs from 'node:fs/promises'
import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'
import { normalizeProductName, parseOttoWorkbook } from './otto-parser'

async function createFixture(): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('STOCK Y PRECIO')
  sheet.getRow(9).values = [
    '',
    'STOCK',
    'PRECIO COMPRA',
    'VALOR STOCK',
    '% BOLSA',
    'BOLSA VENTA',
    '% KILO',
    'KILOS',
    'VENTA X KILO',
    'VENTAS BOLSAS',
    'VENTA X KILO',
  ]
  sheet.getRow(10).values = [
    'AGILITY PERRO ADULTO 20KG',
    2,
    10000,
    20000,
    3500,
    13500,
    6000,
    20,
    800,
    5,
    3,
  ]
  sheet.getRow(11).values = [
    'COLLAR #4 DON-CAN',
    0,
    2000,
    0,
    2000,
    1,
    0,
    null,
    { formula: '=(C11+G11)/H11', result: { error: '#DIV/0!' } },
    1,
    null,
  ]
  const buffer = await workbook.xlsx.writeBuffer()
  return new Uint8Array(buffer)
}

describe('parseOttoWorkbook', () => {
  it('normaliza nombres y extrae stock, márgenes y venta por kilo', async () => {
    const result = await parseOttoWorkbook(await createFixture())
    const product = result.rows[0]

    expect(result.headerRow).toBe(9)
    expect(result.summary.total).toBe(2)
    expect(product.brandCandidate).toBe('AGILITY')
    expect(product.categoryCandidate).toBe('alimentos')
    expect(product.petTypeCandidates).toContain('perros')
    expect(product.packageWeightKg).toBe(20)
    expect(product.packageMarginPercent).toBe(35)
    expect(product.kgMarginPercent).toBe(60)
    expect(product.sellsByKg).toBe(true)
  })

  it('marca precios de venta menores al costo para revisión', async () => {
    const result = await parseOttoWorkbook(await createFixture())
    const collar = result.rows[1]

    expect(collar.status).toBe('review')
    expect(collar.issues.map((issue) => issue.message)).toContain(
      'El precio de venta es menor que el costo',
    )
  })

  it('normaliza acentos, signos y espacios', () => {
    expect(normalizeProductName('  Mordida pequeña 15 kg  ')).toBe(
      'MORDIDA PEQUENA 15 KG',
    )
  })
})

const realWorkbookPath = process.env.OTTO_XLSX_PATH

describe.skipIf(!realWorkbookPath)('OTTO.xlsx real', () => {
  it('reconcilia los totales principales de la hoja de stock', async () => {
    const file = await fs.readFile(realWorkbookPath!)
    const result = await parseOttoWorkbook(file)

    expect(result.summary.total).toBe(370)
    expect(result.summary.positiveStock).toBe(218)
    expect(result.summary.outOfStock).toBe(152)
    expect(result.summary.totalStockQuantity).toBe(850)
    expect(result.summary.inventoryCostValue).toBe(8253989.08)
    expect(result.summary.sellsByKg).toBe(156)
    expect(result.summary.packageSales).toBe(4024)
    expect(result.summary.kgSales).toBe(587)
    expect(result.summary.unidentifiedBrands).toBe(214)
    expect(result.summary.review).toBe(2)
  })
})
