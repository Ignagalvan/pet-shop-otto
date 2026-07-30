import { ImportPreviewForm } from '@/components/admin/import-preview-form'

export const metadata = { title: 'Importar productos' }

export default async function ImportProductsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-brown">Catálogo</p>
      <h1 className="mt-2 text-3xl font-extrabold">Importar productos</h1>
      <p className="mt-2 mb-7 text-muted-foreground">
        Subí el Excel mensual y comprobá los datos antes de aplicarlos.
      </p>
      <ImportPreviewForm />
    </main>
  )
}
