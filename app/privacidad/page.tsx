import type { Metadata } from 'next'
import { ShieldCheck } from 'lucide-react'
import { getPublicStoreSettings } from '@/lib/store-settings-server'
import { waLink } from '@/lib/whatsapp'

export const metadata: Metadata = { title: 'Política de privacidad' }

export default async function PrivacyPage() {
  const settings = await getPublicStoreSettings()
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand text-white">
          <ShieldCheck className="size-5" />
        </span>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-brown">
            Tus datos
          </p>
          <h1 className="mt-1 text-3xl font-extrabold">
            Política de privacidad
          </h1>
        </div>
      </div>
      <div className="mt-8 space-y-7 rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
        <PrivacySection title="Qué información usamos">
          Podemos solicitar nombre, teléfono, correo, datos de entrega,
          información de tu mascota y el contenido necesario para responder una
          consulta o preparar un pedido.
        </PrivacySection>
        <PrivacySection title="Para qué la usamos">
          La información se utiliza para registrar y gestionar pedidos,
          coordinar pagos y entregas, responder consultas y brindar atención
          relacionada con Pet Shop Otto.
        </PrivacySection>
        <PrivacySection title="WhatsApp y servicios externos">
          Cuando elegís enviar una orden o consulta por WhatsApp, la información
          también queda sujeta a las condiciones y políticas de esa plataforma.
        </PrivacySection>
        <PrivacySection title="Conservación y acceso">
          Pet Shop Otto conserva la información necesaria para administrar la
          operación y su historial. El acceso al panel está limitado a usuarios
          autorizados.
        </PrivacySection>
        <PrivacySection title="Consultas sobre tus datos">
          Podés pedir información, corrección o eliminación de tus datos
          escribiendo por{' '}
          <a
            href={waLink(
              'Hola Pet Shop Otto, quiero hacer una consulta sobre mis datos.',
              settings.whatsappNumber,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-brand underline"
          >
            WhatsApp
          </a>
          .
        </PrivacySection>
      </div>
    </div>
  )
}

function PrivacySection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="text-lg font-extrabold">{title}</h2>
      <p className="mt-2 leading-7 text-muted-foreground">{children}</p>
    </section>
  )
}
