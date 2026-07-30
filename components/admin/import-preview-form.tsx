'use client'

import { useState, type FormEvent } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  LoaderCircle,
} from 'lucide-react'

type ImportPreview = {
  fileName: string
  summary: {
    total: number
    valid: number
    review: number
    errors: number
    positiveStock: number
    outOfStock: number
    totalStockQuantity: number
    inventoryCostValue: number
    sellsByKg: number
    unidentifiedBrands: number
  }
  sample: Array<{
    rowNumber: number
    rawName: string
    brandCandidate: string | null
    stockQuantity: number
    purchasePrice: number | null
    packagePrice: number | null
    status: string
  }>
}

type ApplyResult = {
  batchId: string
  total: number
  new: number
  updated: number
  review: number
  errors: number
}

export function ImportPreviewForm() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [applied, setApplied] = useState<ApplyResult | null>(null)
  const currency = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setPreview(null)
    setApplied(null)

    if (!file) {
      setError('Elegí el archivo OTTO.xlsx.')
      setLoading(false)
      return
    }

    const form = new FormData()
    form.append('file', file)
    const response = await fetch('/api/admin/import-preview', {
      method: 'POST',
      body: form,
    })
    const payload = await response.json()

    if (!response.ok) {
      setError(payload.error ?? 'No pudimos leer el archivo.')
      setLoading(false)
      return
    }

    setPreview(payload)
    setLoading(false)
  }

  async function handleApply() {
    if (!file || !preview || !confirmed) return

    setApplying(true)
    setError('')
    const form = new FormData()
    form.append('file', file)

    const response = await fetch('/api/admin/import-apply', {
      method: 'POST',
      body: form,
    })
    const payload = await response.json()

    if (!response.ok) {
      setError(payload.error ?? 'No pudimos guardar la importación.')
      setApplying(false)
      return
    }

    setApplied(payload)
    setApplying(false)
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="rounded-3xl border bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-success/10 p-3 text-success">
            <FileSpreadsheet className="size-7" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold">Revisar un Excel</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Primero mostramos los cambios. Nada se guarda hasta que los confirmes.
            </p>
          </div>
        </div>
        <input
          name="file"
          type="file"
          accept=".xlsx"
          required
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null)
            setPreview(null)
            setApplied(null)
            setConfirmed(false)
            setError('')
          }}
          className="mt-6 block w-full rounded-xl border bg-background p-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:font-bold file:text-white"
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 font-bold text-white transition hover:bg-primary/90 disabled:opacity-60 sm:w-auto"
        >
          {loading && <LoaderCircle className="size-5 animate-spin" />}
          {loading ? 'Analizando productos…' : 'Generar vista previa'}
        </button>
        {error && (
          <p role="alert" className="mt-4 flex gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        )}
      </form>

      {preview && (
        <section className="space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {[
              ['Productos', preview.summary.total],
              ['Con stock', preview.summary.positiveStock],
              ['Sin stock', preview.summary.outOfStock],
              ['Observaciones', preview.summary.review + preview.summary.errors],
              ['Sin marca detectada', preview.summary.unidentifiedBrands],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border bg-white p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-extrabold">{value}</p>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b p-5">
              <CheckCircle2 className="size-5 text-success" />
              <h2 className="font-extrabold">Primeras filas de {preview.fileName}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full text-left text-sm">
                <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Producto</th>
                    <th className="px-4 py-3">Marca</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Costo</th>
                    <th className="px-4 py-3">Venta</th>
                    <th className="px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {preview.sample.map((row) => (
                    <tr key={row.rowNumber}>
                      <td className="max-w-sm px-4 py-3 font-semibold">{row.rawName}</td>
                      <td className="px-4 py-3">{row.brandCandidate ?? 'Revisar'}</td>
                      <td className="px-4 py-3">{row.stockQuantity}</td>
                      <td className="px-4 py-3">{row.purchasePrice === null ? '—' : currency.format(row.purchasePrice)}</td>
                      <td className="px-4 py-3">{row.packagePrice === null ? '—' : currency.format(row.packagePrice)}</td>
                      <td className="px-4 py-3">
                        {row.status === 'valid'
                          ? 'Correcto'
                          : row.status === 'review'
                            ? 'Revisar'
                            : 'Error'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {!applied ? (
            <div className="rounded-3xl border border-primary/20 bg-primary/5 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <Database className="mt-0.5 size-6 shrink-0 text-primary" />
                <div>
                  <h2 className="font-extrabold">Confirmar actualización del catálogo</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Se crearán o actualizarán los {preview.summary.total} productos. Los nuevos quedarán sin publicar hasta completar sus fotos y descripciones.
                  </p>
                </div>
              </div>
              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border bg-white p-4 text-sm">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(event) => setConfirmed(event.target.checked)}
                  className="mt-0.5 size-4 accent-primary"
                />
                <span>
                  Revisé el resumen y confirmo que quiero guardar los precios y el stock de este Excel.
                </span>
              </label>
              <button
                type="button"
                disabled={!confirmed || applying || preview.summary.errors > 0}
                onClick={handleApply}
                className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-success px-5 font-bold text-white transition hover:bg-success/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {applying && <LoaderCircle className="size-5 animate-spin" />}
                {applying ? 'Guardando en Supabase…' : 'Aplicar importación'}
              </button>
            </div>
          ) : (
            <div className="rounded-3xl border border-success/30 bg-success/10 p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-7 shrink-0 text-success" />
                <div>
                  <h2 className="text-xl font-extrabold">Importación aplicada correctamente</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {applied.new} productos nuevos, {applied.updated} actualizados y {applied.review} con observaciones guardadas para revisar.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
