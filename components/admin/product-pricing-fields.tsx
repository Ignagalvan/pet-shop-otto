'use client'

import { useState } from 'react'
import { calculateSalePrice, pricingNumber, roundCashPrice, roundingSteps } from '@/lib/product-pricing'
import { formatPrice } from '@/lib/format'

type PricingValues = {
  cost: string; weight: string; packageMargin: string; kgMargin: string
  packagePrice: string; kgPrice: string; step: number
  autoPackage: boolean; autoKg: boolean; kgChanged: boolean
}

export function ProductPricingFields({ initial }: { initial: {
  cost: number; weight: number | null; packageMargin: number | null; kgMargin: number | null
  packagePrice: number | null; kgPrice: number | null; roundingStep: number; sellsByKg: boolean
} }) {
  const [values, setValues] = useState<PricingValues>(() => ({
    cost: String(initial.cost), weight: String(initial.weight ?? ''),
    packageMargin: String(initial.packageMargin ?? ''), kgMargin: String(initial.kgMargin ?? ''),
    packagePrice: String(initial.packagePrice ?? 0), kgPrice: String(initial.kgPrice ?? ''),
    step: initial.roundingStep, autoPackage: false, autoKg: false, kgChanged: false,
  }))
  const [sellsByKg, setSellsByKg] = useState(initial.sellsByKg)
  function recalculate(next: PricingValues, packageToo: boolean, kgToo: boolean) {
    const cost = pricingNumber(next.cost)
    const packageMargin = pricingNumber(next.packageMargin)
    const kgMargin = pricingNumber(next.kgMargin)
    const weight = pricingNumber(next.weight)
    if (packageToo) {
      const price = cost === null || packageMargin === null ? null : calculateSalePrice(cost, packageMargin, next.step)
      next = {...next, autoPackage: true, packagePrice: price === null ? '' : String(price)}
    }
    if (kgToo && sellsByKg) {
      const price = cost === null || kgMargin === null || weight === null ? null : calculateSalePrice(cost, kgMargin, next.step, weight)
      next = {...next, autoKg: true, kgChanged: true, kgPrice: price === null ? '' : String(price)}
    }
    return next
  }
  const inputClass = 'h-11 w-full min-w-0 rounded-xl border bg-white px-3 outline-none focus:border-primary focus:ring-3 focus:ring-primary/10'
  const labelClass = 'block min-w-0 text-sm font-extrabold text-foreground/80'
  const priceInput = (mode: 'package' | 'kg') => {
    const key = mode === 'kg' ? 'kgPrice' : 'packagePrice'
    const value = values[key]
    return <div className="min-w-0"><label className={labelClass}><span className="mb-1.5 block sm:sr-only">{mode === 'kg' ? 'Precio final de 1 kg suelto' : 'Precio final de la bolsa / unidad'}</span>
      <input name={key} type="number" min="0" max="100000000" step="0.01" required={mode === 'package' || sellsByKg} value={value} onChange={event => setValues(previous => ({...previous, [key]: event.target.value, ...(mode === 'kg' ? {autoKg: false, kgChanged: true} : {autoPackage: false})}))} className={inputClass}/>
      </label><button type="button" className="mt-2 text-left text-xs font-bold text-primary underline underline-offset-2" onClick={() => setValues(previous => {
        const number = pricingNumber(previous[key])
        const rounded = number === null ? null : roundCashPrice(number, previous.step)
        return rounded === null ? previous : {...previous, [key]: String(rounded), ...(mode === 'kg' ? {autoKg: false, kgChanged: true} : {autoPackage: false})}
      })}>Redondear precio hacia arriba</button>
    </div>
  }
  return <>
    <input type="hidden" name="automaticPackagePrice" value={String(values.autoPackage)}/>
    <input type="hidden" name="automaticKgPrice" value={String(values.autoKg)}/>
    <input type="hidden" name="syncLoosePrice" value={String(values.kgChanged && sellsByKg)}/>
    <label className={labelClass}><span className="mb-1.5 flex min-h-10 items-end">Peso de la bolsa (kg)</span>
      <input name="packageWeightKg" type="number" min="0" max="1000000" step="0.001" value={values.weight} onChange={event => setValues(previous => recalculate({...previous, weight: event.target.value}, false, true))} className={inputClass}/>
    </label>
    <div className="space-y-5 sm:col-span-2 lg:col-span-3">
    <div className="grid gap-4 sm:grid-cols-2">
    <div className="min-w-0"><label className={labelClass}><span className="mb-1.5 flex min-h-10 items-end">Costo de la bolsa / unidad</span>
      <input name="purchaseCost" type="number" min="0" max="100000000" step="0.01" required value={values.cost} onChange={event => setValues(previous => recalculate({...previous, cost: event.target.value}, true, true))} className={inputClass}/>
      </label><button type="button" className="mt-2 text-left text-xs font-bold text-primary underline underline-offset-2" onClick={() => setValues(previous => {
        const cost = pricingNumber(previous.cost)
        return cost === null ? previous : recalculate({...previous, cost: String(Math.ceil(cost))}, true, true)
      })}>Redondear costo al peso superior</button>
    </div>
    <label className={labelClass}><span className="mb-1.5 flex min-h-10 items-end">Redondear hacia arriba a múltiplos de</span>
      <select name="roundingStep" value={values.step} onChange={event => setValues(previous => recalculate({...previous, step: Number(event.target.value)}, true, true))} className={inputClass}>
        {roundingSteps.map(step => <option key={step} value={step}>{formatPrice(step)}</option>)}
      </select>
    </label>
    </div>
    <div className="overflow-hidden rounded-xl border">
    <table className="block w-full table-fixed text-left sm:table">
      <caption className="sr-only">Precios de venta por modalidad</caption>
      <thead className="hidden bg-muted/60 text-xs font-extrabold text-muted-foreground sm:table-header-group"><tr>
        <th scope="col" className="w-[24%] px-3 py-3">Venta</th>
        <th scope="col" className="w-[32%] px-3 py-3">Margen sobre costo (%)</th>
        <th scope="col" className="w-[44%] px-3 py-3">Precio final ($)</th>
      </tr></thead>
      <tbody className="block divide-y sm:table-row-group">
      <tr className="block sm:table-row">
      <th scope="row" className="block px-3 pb-0 pt-4 text-sm font-extrabold sm:table-cell sm:align-top sm:pt-6">Bolsa / unidad</th>
      <td className="block p-3 align-top sm:table-cell"><label className={labelClass}><span className="mb-1.5 block sm:sr-only">Margen bolsa (%) sobre el costo</span>
      <input name="packageMarginPercent" type="number" min="0" max="10000" step="0.01" required={values.autoPackage} value={values.packageMargin} onChange={event => setValues(previous => recalculate({...previous, packageMargin: event.target.value}, true, false))} className={inputClass}/>
      </label></td>
      <td className="block p-3 pt-0 align-top sm:table-cell sm:pt-3">{priceInput('package')}</td>
      </tr>
      <tr className="block sm:table-row">
      <th scope="row" className="block px-3 pb-0 pt-4 text-sm font-extrabold sm:table-cell sm:align-top sm:pt-6">Suelto / kg</th>
      <td className="block p-3 align-top sm:table-cell"><label className={labelClass}><span className="mb-1.5 block sm:sr-only">Margen por kilo (%) sobre el costo</span>
      <input name="kgMarginPercent" type="number" min="0" max="10000" step="0.01" required={values.autoKg && sellsByKg} value={values.kgMargin} onChange={event => setValues(previous => recalculate({...previous, kgMargin: event.target.value}, false, true))} className={inputClass}/>
      </label></td>
      <td className="block p-3 pt-0 align-top sm:table-cell sm:pt-3">{priceInput('kg')}</td>
      </tr>
      </tbody>
    </table>
    </div>
    <label className="flex items-center gap-3 rounded-xl border bg-background p-3 text-sm font-bold">
      <input name="sellsByKg" type="checkbox" checked={sellsByKg} onChange={event => setSellsByKg(event.target.checked)} className="size-4 accent-primary"/> Se vende por kilo
    </label>
    <div className="rounded-xl bg-primary/5 p-4 text-sm leading-6" aria-live="polite">
      <div className="grid gap-3 sm:grid-cols-2"><p><span className="block text-xs font-bold text-muted-foreground">Precio final bolsa</span><strong className="text-lg">{pricingNumber(values.packagePrice) === null ? 'Completá costo y porcentaje' : formatPrice(Number(values.packagePrice))}</strong></p>{sellsByKg && <p><span className="block text-xs font-bold text-muted-foreground">Precio final suelto</span><strong className="text-lg">{pricingNumber(values.kgPrice) === null ? 'Completá costo, peso y porcentaje' : `${formatPrice(Number(values.kgPrice))} / kg`}</strong></p>}</div>
      <p className="mt-2 text-xs text-muted-foreground">Precio = costo × (1 + porcentaje / 100). Para el kilo se divide primero el costo por el peso de la bolsa. Al cambiar costo, porcentaje o redondeo se recalcula; también podés escribir un precio manual. Los cambios se aplican al guardar, no al abrir esta pantalla.</p>
      {sellsByKg && <p className="mt-2 text-xs font-bold">El precio del suelto se comparte entre los tamaños del mismo alimento. Cambiar precios no abre bolsas ni modifica kilos disponibles.</p>}
    </div>
    </div>
  </>
}
