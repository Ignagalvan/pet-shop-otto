import Link from 'next/link'
import { PawPrint } from 'lucide-react'

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <span className="flex size-20 items-center justify-center rounded-full bg-secondary text-brand"><PawPrint className="size-9" /></span>
      <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.18em] text-brown">Error 404</p>
      <h1 className="mt-2 text-3xl font-extrabold">Otto no encontró esta página</h1>
      <p className="mt-3 text-muted-foreground">La página o el producto que buscás ya no está disponible.</p>
      <Link href="/productos" className="mt-7 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white">Volver a productos</Link>
    </section>
  )
}
