import { Database, ShieldCheck } from 'lucide-react'
import { AdminLoginForm } from '@/components/admin/login-form'
import { isSupabaseConfigured } from '@/lib/supabase/config'

export const metadata = { title: 'Acceso al panel' }

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; motivo?: string }>
}) {
  const { next, motivo } = await searchParams

  if (!isSupabaseConfigured()) {
    return (
      <main className="mx-auto max-w-xl px-4 py-14">
        <div className="rounded-3xl border bg-white p-7 shadow-sm">
          <Database className="size-9 text-primary" />
          <h1 className="mt-4 text-2xl font-extrabold">Supabase todavía no está conectado</h1>
          <p className="mt-2 text-muted-foreground">
            El panel ya está preparado. Falta crear el proyecto y colocar sus claves en el entorno.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-md px-4 py-14">
      <div className="rounded-3xl border bg-white p-7 shadow-sm">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheck className="size-7" />
        </div>
        <h1 className="mt-5 text-2xl font-extrabold">Panel de Pet Shop Otto</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Acceso privado para administrar productos, precios y stock.
        </p>
        {motivo === 'nuevo-dia' && (
          <p className="mt-4 rounded-xl bg-primary/8 p-3 text-sm font-semibold leading-5 text-primary">
            Comenzó una nueva jornada. Ingresá nuevamente para proteger el panel.
          </p>
        )}
        <AdminLoginForm nextPath={next} />
      </div>
    </main>
  )
}
