import type { Metadata } from 'next'
import Link from 'next/link'
import { FileCheck2 } from 'lucide-react'
import { getPublicStoreSettings } from '@/lib/store-settings-server'
import { waLink } from '@/lib/whatsapp'

export const metadata: Metadata = { title: 'Condiciones de compra' }

export default async function PurchaseTermsPage() {
  const settings = await getPublicStoreSettings()
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand text-white">
          <FileCheck2 className="size-5" />
        </span>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-brown">
            Información importante
          </p>
          <h1 className="mt-1 text-3xl font-extrabold">
            Condiciones de compra
          </h1>
        </div>
      </div>
      <div className="mt-8 space-y-7 rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
        <LegalSection title="Confirmación del pedido">
          El envío del formulario registra una solicitud. Pet Shop Otto confirma
          por WhatsApp la disponibilidad, el total, la forma de entrega y el
          pago antes de preparar el pedido.
        </LegalSection>
        <LegalSection title="Precios, stock y entrega">
          Los precios y el stock publicados se mantienen actualizados, pero
          pueden variar hasta la confirmación final. El costo y las condiciones
          de entrega se muestran antes de enviar la orden.
        </LegalSection>
        <LegalSection title="Pagos y comprobantes">
          Podés usar las formas de pago habilitadas en el checkout. Si elegís
          transferencia, enviá el comprobante por WhatsApp. El pago queda
          pendiente hasta que el negocio lo confirme.
        </LegalSection>
        <LegalSection title="Productos a pedido y señas">
          Antes de abonar, recibirás la cotización, el plazo estimado y las
          condiciones de la seña. El encargo comienza únicamente cuando aceptás
          esas condiciones y la seña queda confirmada.
        </LegalSection>
        <LegalSection title="Consultas">
          Si necesitás aclarar una condición antes de comprar, escribinos por{' '}
          <a
            href={waLink(
              'Hola Pet Shop Otto, tengo una consulta sobre las condiciones de compra.',
              settings.whatsappNumber,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-brand underline"
          >
            WhatsApp
          </a>
          . También podés consultar nuestra{' '}
          <Link href="/privacidad" className="font-bold text-brand underline">
            política de privacidad
          </Link>
          .
        </LegalSection>
      </div>
    </div>
  )
}

function LegalSection({
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
