'use client'

import { Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { toKilograms } from '@/lib/sale-quantity'
import type { CartItem } from './store-provider'
import { useStore } from './store-provider'

export function CartQuantity({item}:{item:CartItem}) {
 const {updateQuantity}=useStore()
 const [draft,setDraft]=useState(String(item.quantity))
 if(item.saleMode==='kg') return <label className="flex flex-wrap items-center gap-2 text-sm font-bold"><span>Suelto</span><input aria-label={`Kilos sueltos de ${item.product.name}`} type="number" min="0.001" max="1000" step="0.001" value={draft} onChange={event=>{setDraft(event.target.value);const kg=toKilograms(event.target.value,'kg');if(kg!==null)updateQuantity(item.key,kg)}} onBlur={()=>{if(toKilograms(draft,'kg')===null)setDraft(String(item.quantity))}} className="h-10 w-24 rounded-xl border bg-white px-2" /><span>kg</span></label>
 return <div className="flex items-center rounded-xl border border-border"><button type="button" disabled={item.quantity<=1} onClick={()=>updateQuantity(item.key,item.quantity-1)} className="flex size-9 items-center justify-center disabled:opacity-40" aria-label="Restar"><Minus className="size-4" /></button><span className="w-8 text-center font-bold">{item.quantity}</span><button type="button" onClick={()=>updateQuantity(item.key,item.quantity+1)} className="flex size-9 items-center justify-center" aria-label="Sumar"><Plus className="size-4" /></button></div>
}
