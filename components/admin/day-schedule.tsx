'use client'

import { useRef, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { BusinessDay } from '@/lib/store-settings'

export function DaySchedule({day, label, schedule}: {day: number; label: string; schedule: BusinessDay}) {
  const [enabled, setEnabled] = useState(schedule.enabled)
  const [shifts, setShifts] = useState(() => (schedule.shifts.length ? schedule.shifts : [{start: '08:30', end: '20:30'}]).map((shift, id) => ({...shift, id})))
  const nextId = useRef(shifts.length)
  function change(id: number, field: 'start' | 'end', value: string) {
    setShifts(previous => previous.map(shift => shift.id === id ? {...shift, [field]: value} : shift))
  }
  return <div className="grid gap-3 rounded-2xl border border-border bg-[#fbfcfe] p-4 sm:grid-cols-[130px_minmax(0,1fr)]">
    <label className="flex h-11 items-center gap-2 text-sm font-extrabold">
      <input type="checkbox" name={`day-${day}-enabled`} checked={enabled} onChange={event => setEnabled(event.target.checked)} className="size-4 accent-primary"/>{label}
    </label>
    {enabled ? <div className="min-w-0 space-y-3">
      {shifts.map((shift, index) => <fieldset key={shift.id} className="min-w-0">
        <legend className="mb-1.5 text-xs font-bold text-muted-foreground">{shifts.length === 1 ? 'Horario corrido' : index === 0 ? 'Turno 1 · principal' : `Turno ${index + 1}`}</legend>
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_2.5rem] items-center gap-2">
          <input type="time" name={`day-${day}-start`} value={shift.start} onInput={event => change(shift.id, 'start', event.currentTarget.value)} onChange={event => change(shift.id, 'start', event.target.value)} required aria-label={`${label}, apertura del turno ${index + 1}`} className="h-11 w-full min-w-0 max-w-full rounded-xl border border-border bg-white px-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"/>
          <span className="text-xs font-bold text-muted-foreground">a</span>
          <input type="time" name={`day-${day}-end`} value={shift.end} onInput={event => change(shift.id, 'end', event.currentTarget.value)} onChange={event => change(shift.id, 'end', event.target.value)} required aria-label={`${label}, cierre del turno ${index + 1}`} className="h-11 w-full min-w-0 max-w-full rounded-xl border border-border bg-white px-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"/>
          {shifts.length > 1 ? <button type="button" onClick={() => setShifts(previous => previous.filter(item => item.id !== shift.id))} aria-label={`Quitar turno ${index + 1} del ${label.toLowerCase()}`} className="flex size-10 items-center justify-center rounded-xl border border-border text-destructive transition hover:bg-destructive/5"><Trash2 className="size-4"/></button> : <span/>}
        </div>
      </fieldset>)}
      <button type="button" onClick={() => {
        const id = nextId.current++
        setShifts(previous => [...previous, {id, start: previous.at(-1)?.end ?? '', end: ''}])
      }} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-primary/25 bg-white px-3 text-xs font-extrabold text-primary transition hover:bg-primary/5"><Plus className="size-4"/>Agregar turno</button>
    </div> : <p className="flex min-h-11 items-center text-sm text-muted-foreground">Cerrado este día. Activá el día para cargar sus horarios.</p>}
  </div>
}
