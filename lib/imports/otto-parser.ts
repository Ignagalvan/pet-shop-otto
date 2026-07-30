import ExcelJS from 'exceljs'

const SHEET_NAME = 'STOCK Y PRECIO'

const KNOWN_BRANDS = [
  'PURINA CAT CHOW',
  'TOP NUTRITION',
  'ROYAL CANIN',
  'ESTAMPA PLUS',
  'ESTAMPA CRIADORES',
  'OLD PRINCE',
  'VITAL CAN',
  'CAN CLUB',
  'LITTER CAT',
  'PUPY FOOD',
  '9 VIDAS',
  'EXCELLENT',
  'FORTALEZA',
  'NUTRIMEAT',
  'SABROSITO',
  'COMPINCHE',
  'NUTRIBON',
  'PEDIGREE',
  'AGILITY',
  'DELEITA',
  'DIABSOR',
  'DR DIPI',
  'ODWALLA',
  'SIEGER',
  'WHISKAS',
  'KONGO',
  'SANNO',
  'EXACT',
  'FELIX',
  'AMICI',
  'LEVEL',
  'KEN L',
  'RAZA',
  'GATI',
  'VORAZ',
  'ROCKET',
  'RUBICAT',
  'ZIMPI',
] as const

export type ImportSeverity = 'info' | 'warning' | 'error'

export type ImportIssue = {
  code:
    | 'invalid_stock'
    | 'invalid_purchase_price'
    | 'invalid_sale_price'
    | 'sale_below_cost'
    | 'missing_kg_price'
    | 'unidentified_brand'
  severity: ImportSeverity
  message: string
}

export type OttoProductRow = {
  rowNumber: number
  rawName: string
  normalizedName: string
  brandCandidate: string | null
  categoryCandidate: string
  petTypeCandidates: string[]
  presentation: string | null
  packageWeightKg: number | null
  stockQuantity: number
  purchasePrice: number | null
  stockValue: number
  packagePrice: number | null
  kgPrice: number | null
  sellsByPackage: boolean
  sellsByKg: boolean
  packageMarginPercent: number | null
  kgMarginPercent: number | null
  packageSales: number
  kgSales: number
  status: 'valid' | 'review' | 'error'
  issues: ImportIssue[]
}

export type OttoImportResult = {
  sheetName: string
  headerRow: number
  rows: OttoProductRow[]
  summary: {
    total: number
    valid: number
    review: number
    errors: number
    positiveStock: number
    outOfStock: number
    totalStockQuantity: number
    inventoryCostValue: number
    sellsByKg: number
    packageSales: number
    kgSales: number
    unidentifiedBrands: number
  }
}

function readCell(cell: ExcelJS.Cell): unknown {
  const value = cell.value
  if (value && typeof value === 'object') {
    if ('result' in value) return value.result
    if ('richText' in value) {
      return value.richText.map((part) => part.text).join('')
    }
    if ('text' in value) return value.text
    if ('error' in value) return value.error
  }
  return value
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : String(value ?? '').trim()
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return null

  const clean = value
    .replace(/\$/g, '')
    .replace(/\s/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.')

  const parsed = Number(clean)
  return Number.isFinite(parsed) ? parsed : null
}

export function normalizeProductName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function inferBrand(normalizedName: string): string | null {
  return (
    KNOWN_BRANDS.find(
      (brand) => normalizedName === brand || normalizedName.startsWith(`${brand} `),
    ) ?? null
  )
}

function inferCategory(normalizedName: string): string {
  if (/\b(SEMILLA|MAIZ|ALPISTE|GIRASOL|MIEL|ALFALFA|FARDO)\b/.test(normalizedName)) {
    return 'semillas-granja'
  }
  if (/\b(SHAMPOO|ARENA|PIEDR|PELLET ECOLOGICO|LITTER|DIABSOR)\b/.test(normalizedName)) {
    return 'higiene'
  }
  if (/\b(PELOTA|MORDILLO|HUESO|VARITA|RASCADOR|JUGUETE)\b/.test(normalizedName)) {
    return 'juguetes'
  }
  if (/\b(COLCHON|MOISES|CAMA|CUCHA)\b/.test(normalizedName)) return 'camas'
  if (/\b(COLLAR|CORREA|PRETAL|BOZAL|CADENA|CINTURON)\b/.test(normalizedName)) {
    return 'paseo'
  }
  if (/\b(COMEDERO|BEBEDERO|ALPARGATA|ALICATE|CEPILLO|RODILLO)\b/.test(normalizedName)) {
    return 'accesorios'
  }
  if (/\b(DENTAL|PALITO|CHIFLE|SNACK|PREMIO|TREAT)\b/.test(normalizedName)) {
    return 'snacks'
  }
  if (
    /\b(ADULTO|CACHORRO|PUPPY|KITTEN|GATO|PERRO|ALIMENTO|CARNE|POLLO|SALMON|URINARY|CRIADORES)\b/.test(
      normalizedName,
    )
  ) {
    return 'alimentos'
  }
  return 'otros'
}

function inferPetTypes(normalizedName: string): string[] {
  const matches = new Set<string>()
  if (/\b(PERRO|CACHORRO|PUPPY|CANINO)\b/.test(normalizedName)) matches.add('perros')
  if (/\b(GATO|GATITO|KITTEN|FELINO)\b/.test(normalizedName)) matches.add('gatos')
  if (/\b(AVE|PAJARO|ALPISTE)\b/.test(normalizedName)) matches.add('aves')
  if (/\b(PEZ|PESCADO|TROPICAL|GOLDFISH)\b/.test(normalizedName)) matches.add('peces')
  if (/\b(HAMSTER|ROEDOR)\b/.test(normalizedName)) matches.add('roedores')
  if (/\b(CABALLO|EQUINO|ALFALFA|FARDO)\b/.test(normalizedName)) matches.add('caballos')
  return [...matches]
}

function parsePresentation(rawName: string): {
  presentation: string | null
  weightKg: number | null
} {
  const matches = [
    ...rawName.matchAll(
      /(\d+(?:[.,]\d+)?)\s*(KGS?|KG|GRS?|GR|G|ML|LTS?|LT)\b/gi,
    ),
  ]
  const match = matches.at(-1)
  if (!match) return { presentation: null, weightKg: null }

  const amount = Number(match[1].replace(',', '.'))
  const unit = match[2].toUpperCase()
  let weightKg: number | null = null

  if (unit.startsWith('KG') || unit === 'K') weightKg = amount
  if (unit === 'G' || unit.startsWith('GR')) weightKg = amount / 1000

  return {
    presentation: `${match[1]} ${match[2].toLowerCase()}`,
    weightKg,
  }
}

function percentage(amount: number | null, base: number | null): number | null {
  if (amount === null || base === null || base <= 0) return null
  return Math.round((amount / base) * 10000) / 100
}

function buildRow(worksheet: ExcelJS.Worksheet, rowNumber: number): OttoProductRow | null {
  const row = worksheet.getRow(rowNumber)
  const rawName = asText(readCell(row.getCell(1)))
  if (!rawName) return null

  const normalizedName = normalizeProductName(rawName)
  const stock = asNumber(readCell(row.getCell(2)))
  const purchasePrice = asNumber(readCell(row.getCell(3)))
  const stockValue = asNumber(readCell(row.getCell(4))) ?? 0
  const packageMarginAmount = asNumber(readCell(row.getCell(5)))
  const packagePrice = asNumber(readCell(row.getCell(6)))
  const kgMarginAmount = asNumber(readCell(row.getCell(7)))
  const kilos = asNumber(readCell(row.getCell(8)))
  const kgPrice = asNumber(readCell(row.getCell(9)))
  const packageSales = asNumber(readCell(row.getCell(10))) ?? 0
  const kgSales = asNumber(readCell(row.getCell(11))) ?? 0
  const issues: ImportIssue[] = []

  if (stock === null || stock < 0) {
    issues.push({ code: 'invalid_stock', severity: 'error', message: 'Stock inválido' })
  }
  if (purchasePrice === null || purchasePrice <= 0) {
    issues.push({
      code: 'invalid_purchase_price',
      severity: 'error',
      message: 'Precio de compra inválido',
    })
  }
  if (packagePrice === null || packagePrice <= 0) {
    issues.push({
      code: 'invalid_sale_price',
      severity: 'error',
      message: 'Precio de venta inválido',
    })
  }
  if (
    purchasePrice !== null &&
    packagePrice !== null &&
    packagePrice < purchasePrice
  ) {
    issues.push({
      code: 'sale_below_cost',
      severity: 'warning',
      message: 'El precio de venta es menor que el costo',
    })
  }
  if (kilos !== null && kilos > 0 && kgPrice === null) {
    issues.push({
      code: 'missing_kg_price',
      severity: 'warning',
      message: 'Tiene kilos informados pero no precio por kilo',
    })
  }

  const brandCandidate = inferBrand(normalizedName)
  if (!brandCandidate) {
    issues.push({
      code: 'unidentified_brand',
      severity: 'info',
      message: 'Marca pendiente de normalizar',
    })
  }

  const parsedPresentation = parsePresentation(rawName)
  const packageWeightKg =
    kilos !== null && kilos > 0 ? kilos : parsedPresentation.weightKg
  const sellsByKg = kilos !== null && kilos > 0 && kgPrice !== null && kgPrice > 0
  const hasError = issues.some((issue) => issue.severity === 'error')
  const hasWarning = issues.some((issue) => issue.severity === 'warning')

  return {
    rowNumber,
    rawName,
    normalizedName,
    brandCandidate,
    categoryCandidate: inferCategory(normalizedName),
    petTypeCandidates: inferPetTypes(normalizedName),
    presentation: parsedPresentation.presentation,
    packageWeightKg,
    stockQuantity: stock ?? 0,
    purchasePrice,
    stockValue,
    packagePrice,
    kgPrice: sellsByKg ? kgPrice : null,
    sellsByPackage: packagePrice !== null && packagePrice > 0,
    sellsByKg,
    packageMarginPercent: percentage(packageMarginAmount, purchasePrice),
    kgMarginPercent: percentage(kgMarginAmount, purchasePrice),
    packageSales,
    kgSales,
    status: hasError ? 'error' : hasWarning ? 'review' : 'valid',
    issues,
  }
}

export async function parseOttoWorkbook(
  input: ArrayBuffer | Uint8Array,
): Promise<OttoImportResult> {
  const workbook = new ExcelJS.Workbook()
  const bytes = Buffer.from(
    input instanceof ArrayBuffer ? new Uint8Array(input) : input,
  )
  // ExcelJS still declares the legacy Node Buffer shape while Node 24 types
  // include resizable ArrayBuffers. The runtime value is the Buffer it expects.
  await workbook.xlsx.load(
    bytes as unknown as Parameters<typeof workbook.xlsx.load>[0],
  )

  const worksheet = workbook.getWorksheet(SHEET_NAME)
  if (!worksheet) throw new Error(`No se encontró la hoja "${SHEET_NAME}"`)

  let headerRow = 0
  worksheet.eachRow((row, rowNumber) => {
    if (headerRow) return
    const stockHeader = normalizeProductName(asText(readCell(row.getCell(2))))
    const priceHeader = normalizeProductName(asText(readCell(row.getCell(3))))
    if (stockHeader === 'STOCK' && priceHeader.includes('PRECIO COMPRA')) {
      headerRow = rowNumber
    }
  })

  if (!headerRow) throw new Error('No se encontró la fila de encabezados de stock')

  const rows: OttoProductRow[] = []
  // `actualRowCount` and `rowCount` can represent the amount of materialized
  // rows after loading, not the last row number. The worksheet dimensions keep
  // the correct bottom boundary even when there are decorative blank rows.
  const lastRowNumber = worksheet.dimensions.bottom
  for (let rowNumber = headerRow + 1; rowNumber <= lastRowNumber; rowNumber += 1) {
    const parsed = buildRow(worksheet, rowNumber)
    if (parsed) rows.push(parsed)
  }

  const summary = rows.reduce<OttoImportResult['summary']>(
    (current, row) => ({
      total: current.total + 1,
      valid: current.valid + Number(row.status === 'valid'),
      review: current.review + Number(row.status === 'review'),
      errors: current.errors + Number(row.status === 'error'),
      positiveStock: current.positiveStock + Number(row.stockQuantity > 0),
      outOfStock: current.outOfStock + Number(row.stockQuantity <= 0),
      totalStockQuantity: current.totalStockQuantity + row.stockQuantity,
      inventoryCostValue: current.inventoryCostValue + row.stockValue,
      sellsByKg: current.sellsByKg + Number(row.sellsByKg),
      packageSales: current.packageSales + row.packageSales,
      kgSales: current.kgSales + row.kgSales,
      unidentifiedBrands:
        current.unidentifiedBrands +
        Number(row.issues.some((issue) => issue.code === 'unidentified_brand')),
    }),
    {
      total: 0,
      valid: 0,
      review: 0,
      errors: 0,
      positiveStock: 0,
      outOfStock: 0,
      totalStockQuantity: 0,
      inventoryCostValue: 0,
      sellsByKg: 0,
      packageSales: 0,
      kgSales: 0,
      unidentifiedBrands: 0,
    },
  )

  summary.inventoryCostValue = Math.round(summary.inventoryCostValue * 100) / 100

  return {
    sheetName: worksheet.name,
    headerRow,
    rows,
    summary,
  }
}
