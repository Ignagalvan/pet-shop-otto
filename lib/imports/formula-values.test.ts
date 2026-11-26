import ExcelJS from 'exceljs'
import fs from 'node:fs/promises'
import { expect, it } from 'vitest'
import { readOttoCell } from './formula-values'
import { parseOttoWorkbook } from './otto-parser'

it('lee stock cero y precios calculados sin resultados guardados', async () => {
  const wb = new ExcelJS.Workbook()
  const sheet = wb.addWorksheet('STOCK Y PRECIO')
  sheet.getRow(9).values = ['PRODUCTO', 'STOCK', 'PRECIO COMPRA']
  sheet.getRow(10).values = ['AGILITY PERRO ADULTO 20KG', {formula:'L10-SUM(J10:K10)'}, 10000, {formula:'(B10*C10)'}, {formula:'(C10)*35/100'}, {formula:'(C10+E10)'}, {formula:'(C10)*60/100'}, 20, {formula:'+(C10+G10)/H10'}, 1, 2, 3]
  const result = await parseOttoWorkbook(new Uint8Array(await wb.xlsx.writeBuffer()))
  expect(result.rows[0]).toMatchObject({stockQuantity:0, stockValue:0, packagePrice:13500, kgPrice:800, status:'valid'})
})

it('rechaza fórmulas no soportadas, ciclos y divisiones inválidas sin ejecutarlas', () => {
  const sheet = new ExcelJS.Workbook().addWorksheet('STOCK Y PRECIO')
  sheet.getCell('B2').value = {formula:'B2+C2'}
  sheet.getCell('C2').value = 1
  expect(readOttoCell(sheet.getCell('B2'))).toBeNull()
  sheet.getCell('B2').value = {formula:'WEBSERVICE("https://example.com")'}
  expect(readOttoCell(sheet.getCell('B2'))).toBeNull()
  sheet.getCell('B2').value = {formula:'(C2+D2)/H2'}
  expect(readOttoCell(sheet.getCell('B2'))).toBeNull()
})

it.skipIf(!process.env.OTTO_REFERENCE_XLSX_PATH)('reconcilia la planilla actual del dueño', async () => {
  const result = await parseOttoWorkbook(await fs.readFile(process.env.OTTO_REFERENCE_XLSX_PATH!))
  expect(result.summary).toMatchObject({total:395, errors:0, review:2, totalStockQuantity:818, packageSales:5046, kgSales:749})
  expect(result.summary.inventoryCostValue).toBeCloseTo(10482571.16, 2)
  expect(result.rows.find(r=>r.rowNumber===11)?.stockQuantity).toBe(0)
})
