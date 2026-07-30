import { Settings2 } from 'lucide-react'
import { StoreSettingsForm } from '@/components/admin/store-settings-form'
import { getPublicStoreSettings } from '@/lib/store-settings-server'
import { requireStaff } from '@/lib/supabase/staff'

export const metadata = { title: 'Configuración del negocio' }

export default async function StoreSettingsPage() {
  const [{ profile }, settings] = await Promise.all([
    requireStaff(),
    getPublicStoreSettings(),
  ])

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-3xl border bg-white p-7">
          No tenés permiso para modificar la configuración.
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
          <Settings2 className="size-5" />
        </span>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brown">
            Administración
          </p>
          <h1 className="mt-1 text-3xl font-extrabold">
            Configuración del negocio
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Lo que guardes acá se aplica al sitio, al carrito y a los nuevos
            pedidos.
          </p>
        </div>
      </div>

      <div className="mt-7">
        <StoreSettingsForm settings={settings} />
      </div>
    </div>
  )
}

