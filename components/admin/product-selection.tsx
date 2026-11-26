'use client'

import { createContext, useContext, useState, useTransition, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { setProductPublicationAction } from '@/app/admin/productos/actions'

type SelectionContext = { selected: string[]; pending: boolean; toggle: (id: string) => void; publish: (ids: string[], visible: boolean) => void }
const Selection = createContext<SelectionContext | null>(null)
function useSelection() {
  const value = useContext(Selection)
  if (!value) throw new Error('Falta el listado de selección')
  return value
}

export function ProductSelection({ ids, children }: { ids: string[]; children: ReactNode }) {
  const [selected, setSelected] = useState<string[]>([])
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const [blocked, setBlocked] = useState<Array<{id:string;name:string;reason:string}>>([])
  const router = useRouter()
  const currentSelected = selected.filter(id => ids.includes(id))
  function publish(targets: string[], visible: boolean) {
    setMessage('')
    setBlocked([])
    startTransition(async () => {
      try {
        const result = await setProductPublicationAction(targets, visible)
        if (result.error) { setMessage(result.error); return }
        setMessage(`${result.updated} producto${result.updated === 1 ? '' : 's'} ${visible ? 'publicado' : 'oculto'}${result.updated === 1 ? '' : 's'}. El stock no cambió.`)
        setBlocked(result.blocked)
        setSelected(previous => previous.filter(id => !targets.includes(id) || result.blocked.some(p => p.id === id)))
        router.refresh()
      } catch {
        setMessage('No se pudo completar el cambio. Recargá para comprobar el estado e intentá nuevamente.')
      }
    })
  }
  return <Selection.Provider value={{selected:currentSelected,pending,toggle:id=>setSelected(previous=>previous.includes(id)?previous.filter(value=>value!==id):[...previous,id]),publish}}>
    <section aria-label="Selección y visibilidad de productos" className="mt-5 min-w-0 rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-h-11 items-center gap-2 font-bold">
          <input type="checkbox" checked={ids.length > 0 && currentSelected.length === ids.length} disabled={pending || !ids.length} onChange={event=>setSelected(event.target.checked?ids:[])} className="size-5 accent-primary" />
          Seleccionar esta página
        </label>
        <span className="text-sm text-muted-foreground">{currentSelected.length} seleccionados</span>
        <button type="button" disabled={pending || !currentSelected.length} onClick={()=>publish(currentSelected,true)} className="min-h-11 rounded-xl bg-success px-4 font-bold text-white disabled:opacity-50">Publicar seleccionados</button>
        <button type="button" disabled={pending || !currentSelected.length} onClick={()=>publish(currentSelected,false)} className="min-h-11 rounded-xl border px-4 font-bold text-primary disabled:opacity-50">Ocultar seleccionados</button>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">Publicar los hace visibles en la tienda. No agrega stock. Para publicar necesitan foto, descripción, categoría, mascota y precio.</p>
      <p role="status" aria-live="polite" className="mt-2 text-sm font-bold">{pending ? 'Guardando visibilidad…' : message}</p>
      {blocked.length > 0 && <div role="alert" className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-950">
        <p className="font-bold">{blocked.length} sin publicar: completá los datos desde Editar.</p>
        <ul className="mt-2 space-y-1">{blocked.map(product=><li key={product.id} className="break-words">{product.name}: {product.reason}</li>)}</ul>
      </div>}
    </section>
    {children}
  </Selection.Provider>
}

export function ProductSelectionCheckbox({ id, name }: { id: string; name: string }) {
  const selection = useSelection()
  return <input type="checkbox" aria-label={`Seleccionar ${name}`} checked={selection.selected.includes(id)} disabled={selection.pending} onChange={()=>selection.toggle(id)} className="size-5 shrink-0 accent-primary" />
}

export function ProductVisibilityButton({ id, published }: { id: string; published: boolean }) {
  const selection = useSelection()
  return <button type="button" disabled={selection.pending} onClick={()=>selection.publish([id],!published)} className="inline-flex min-h-11 items-center justify-center rounded-xl border px-3 text-sm font-bold text-primary hover:bg-primary/5 disabled:opacity-50">{published?'Ocultar':'Publicar'}</button>
}
