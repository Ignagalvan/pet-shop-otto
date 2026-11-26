import type ExcelJS from 'exceljs'

// ExcelJS may omit a cached zero result. Resolve only the arithmetic patterns
// used by OTTO, never execute workbook text or guess an unsupported formula.
export function readOttoCell(cell: ExcelJS.Cell, visited = new Set<string>()): unknown {
  const value = cell.value
  if (!value || typeof value !== 'object') return value
  if ('richText' in value) return value.richText.map(part => part.text).join('')
  if ('text' in value) return value.text
  if ('error' in value) return value.error
  if ('result' in value && value.result !== undefined && value.result !== null) return value.result
  if (!('formula' in value) && !('sharedFormula' in value)) return null
  if (visited.has(cell.address) || visited.size > 20) return null
  const seen = new Set(visited).add(cell.address)
  const formula = cell.formula?.replace(/[\s$]/g, '').replace(/^=/, '').toUpperCase()
  if (!formula) return null
  const numberAt = (address: string): number | null => {
    const referenced = cell.worksheet.getCell(address)
    if (referenced.value === null || referenced.value === undefined || referenced.value === '') return 0
    const resolved = readOttoCell(referenced, seen)
    return typeof resolved === 'number' && Number.isFinite(resolved) ? resolved : null
  }
  const calculate = (addresses: string[], operation: (numbers: number[]) => number) => {
    const numbers = addresses.map(numberAt)
    if (numbers.some(n => n === null)) return null
    const result = operation(numbers as number[])
    return Number.isFinite(result) ? result : null
  }
  let match: RegExpMatchArray | null
  if ((match = formula.match(/^([A-Z]+\d+)-SUM\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)$/))) {
    // The stock formula subtracts the two sales columns on this same row.
    if (match[2] !== 'J' || match[4] !== 'K' || match[3] !== match[5] || Number(match[3]) !== Number(cell.row)) return null
    return calculate([match[1], `J${match[3]}`, `K${match[3]}`], ([input, bags, kilos]) => input - bags - kilos)
  }
  if ((match = formula.match(/^\(?([A-Z]+\d+)\*([A-Z]+\d+)\)?$/))) {
    return calculate([match[1], match[2]], ([a,b]) => a*b)
  }
  if ((match = formula.match(/^\(?([A-Z]+\d+)\)?\*(\d+(?:\.\d+)?)\/100$/))) {
    return calculate([match[1]], ([a]) => a*Number(match![2])/100)
  }
  if ((match = formula.match(/^\(?([A-Z]+\d+)\+([A-Z]+\d+)\)?$/))) {
    return calculate([match[1], match[2]], ([a,b]) => a+b)
  }
  if ((match = formula.match(/^\+?\(([A-Z]+\d+)\+([A-Z]+\d+)\)\/([A-Z]+\d+)$/))) {
    return calculate([match[1], match[2], match[3]], ([a,b,c]) => (a+b)/c)
  }
  return null
}
