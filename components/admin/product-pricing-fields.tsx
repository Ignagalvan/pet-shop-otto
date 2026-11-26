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
  const inputClass = 'mt-1.5 h-11 w-full min-w-0 rounded-xl border bg-white px-3 outline-none focus:border-primary focus:ring-3 focus:ring-primary/10'
  const labelClass = 'block min-w-0 text-sm font-extrabold text-foreground/80'
  const priceInput = (mode: 'package' | 'kg') => {
    const key = mode === 'kg' ? 'kgPrice' : 'packagePrice'
    const value = values[key]
    return <label className={labelClass}>{mode === 'kg' ? 'Precio final de 1 kg suelto' : 'Precio final de la bolsa / unidad'}
      <input name={key} type="number" min="0" max="100000000" step="0.01" required={mode === 'package' || sellsByKg} value={value} onChange={event => setValues(previous => ({...previous, [key]: event.target.value, ...(mode === 'kg' ? {autoKg: false, kgChanged: true} : {autoPackage: false})}))} className={inputClass}/>
      <button type="button" className="mt-2 text-xs font-bold text-primary underline" onClick={() => setValues(previous => {
        const number = pricingNumber(previous[key])
        const rounded = number === null ? null : roundCashPrice(number, previous.step)
        return rounded === null ? previous : {...previous, [key]: String(rounded), ...(mode === 'kg' ? {autoKg: false, kgChanged: true} : {autoPackage: false})}
      })}>Redondear precio hacia arriba</button>
    </label>
  }
  return <>
    <input type="hidden" name="automaticPackagePrice" value={String(values.autoPackage)}/>
    <input type="hidden" name="automaticKgPrice" value={String(values.autoKg)}/>
    <input type="hidden" name="syncLoosePrice" value={String(values.kgChanged && sellsByKg)}/>
    <label className={labelClass}>Peso de la bolsa (kg)
      <input name="packageWeightKg" type="number" min="0" max="1000000" step="0.001" value={values.weight} onChange={event => setValues(previous => recalculate({...previous, weight: event.target.value}, false, true))} className={inputClass}/>
    </label>
    <label className={labelClass}>Costo de la bolsa / unidad
      <input name="purchaseCost" type="number" min="0" max="100000000" step="0.01" required value={values.cost} onChange={event => setValues(previous => recalculate({...previous, cost: event.target.value}, true, true))} className={inputClass}/>
      <button type="button" className="mt-2 text-xs font-bold text-primary underline" onClick={() => setValues(previous => {
        const cost = pricingNumber(previous.cost)
        return cost === null ? previous : recalculate({...previous, cost: String(Math.ceil(cost))}, true, true)
      })}>Redondear costo al peso superior</button>
    </label>
    <label className={labelClass}>Margen bolsa (%) sobre el costo
      <input name="packageMarginPercent" type="number" min="0" max="10000" step="0.01" required={values.autoPackage} value={values.packageMargin} onChange={event => setValues(previous => recalculate({...previous, packageMargin: event.target.value}, true, false))} className={inputClass}/>
    </label>
    {priceInput('package')}
    <label className={labelClass}>Margen por kilo (%) sobre el costo
      <input name="kgMarginPercent" type="number" min="0" max="10000" step="0.01" required={values.autoKg && sellsByKg} value={values.kgMargin} onChange={event => setValues(previous => recalculate({...previous, kgMargin: event.target.value}, false, true))} className={inputClass}/>
    </label>
    {priceInput('kg')}
    <label className={labelClass}>Redondear hacia arriba a múltiplos de
      <select name="roundingStep" value={values.step} onChange={event => setValues(previous => recalculate({...previous, step: Number(event.target.value)}, true, true))} className={inputClass}>
        {roundingSteps.map(step => <option key={step} value={step}>{formatPrice(step)}</option>)}
      </select>
    </label>
    <label className="flex items-center gap-3 self-end rounded-xl border bg-background p-3 text-sm font-bold">
      <input name="sellsByKg" type="checkbox" checked={sellsByKg} onChange={event => setSellsByKg(event.target.checked)} className="size-4 accent-primary"/> Se vende por kilo
    </label>
    <div className="rounded-xl bg-primary/5 p-4 text-sm leading-6 sm:col-span-2 lg:col-span-3" aria-live="polite">
      <p><strong>Precio final bolsa: {pricingNumber(values.packagePrice) === null ? 'Completá costo y porcentaje' : formatPrice(Number(values.packagePrice))}</strong>{sellsByKg && <><br/><strong>Precio final suelto: {pricingNumber(values.kgPrice) === null ? 'Completá costo, peso y porcentaje' : `${formatPrice(Number(values.kgPrice))} / kg`}</strong></>}</p>
      <p className="mt-2 text-xs text-muted-foreground">Precio = costo × (1 + porcentaje / 100). Para el kilo se divide primero el costo por el peso de la bolsa. Al cambiar costo, porcentaje o redondeo se recalcula; también podés escribir un precio manual. Los cambios se aplican al guardar, no al abrir esta pantalla.</p>
      {sellsByKg && <p className="mt-2 text-xs font-bold">El precio del suelto se comparte entre los tamaños del mismo alimento. Cambiar precios no abre bolsas ni modifica kilos disponibles.</p>}
    </div>
  </>
}
