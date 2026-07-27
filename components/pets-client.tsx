'use client'

import { useState } from 'react'
import { Bird, Cat, Dog, Plus, X } from 'lucide-react'

export function PetsClient() {
  const [showForm, setShowForm] = useState(false)
  const [added, setAdded] = useState(false)
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex items-center justify-between gap-4"><div><h2 className="text-2xl font-extrabold">Tu familia animal</h2><p className="mt-1 text-sm text-muted-foreground">Usamos estos datos para recomendar productos adecuados.</p></div><button onClick={() => setShowForm(true)} className="flex h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white"><Plus className="size-4" /> <span className="hidden sm:inline">Agregar mascota</span></button></div>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PetCard icon={Dog} name="Otto" detail="Perro · Adulto · Mediano" note="Prefiere alimento de pollo" />
        <PetCard icon={Cat} name="Mora" detail="Gata · 3 años" note="Piel sensible" />
        {added && <PetCard icon={Bird} name="Pipo" detail="Ave · Adulto" note="Perfil nuevo" />}
      </div>
      {showForm && <div className="fixed inset-0 z-[80] flex items-end justify-center bg-foreground/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"><form onSubmit={(event) => { event.preventDefault(); setAdded(true); setShowForm(false) }} className="relative w-full max-w-lg rounded-t-3xl bg-card p-6 shadow-2xl sm:rounded-3xl sm:p-8"><button type="button" onClick={() => setShowForm(false)} className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-secondary" aria-label="Cerrar"><X className="size-4" /></button><h2 className="text-2xl font-extrabold">Agregar mascota</h2><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Nombre" placeholder="Ej. Pipo" /><label className="text-sm font-bold">Tipo<select className="mt-2 h-12 w-full rounded-xl border border-border bg-card px-4"><option>Perro</option><option>Gato</option><option>Ave</option><option>Roedor</option><option>Caballo</option><option>Otra</option></select></label><Field label="Edad" placeholder="Ej. 3 años" /><Field label="Tamaño o raza" placeholder="Opcional" /></div><button className="mt-6 h-12 w-full rounded-xl bg-brand text-sm font-bold text-white">Guardar mascota</button></form></div>}
    </div>
  )
}

function PetCard({ icon: Icon, name, detail, note }: { icon: typeof Dog; name: string; detail: string; note: string }) {
  return <article className="rounded-3xl border border-border bg-card p-6 shadow-sm"><span className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-brand"><Icon className="size-7" /></span><h3 className="mt-4 text-xl font-extrabold">{name}</h3><p className="mt-1 text-sm text-muted-foreground">{detail}</p><p className="mt-4 rounded-xl bg-background p-3 text-xs font-semibold text-brown">{note}</p><button className="mt-4 text-sm font-bold text-brand">Editar perfil</button></article>
}

function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return <label className="text-sm font-bold">{label}<input required className="mt-2 h-12 w-full rounded-xl border border-border px-4 text-sm outline-none focus:border-brand" placeholder={placeholder} /></label>
}
