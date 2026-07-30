import { NextResponse } from 'next/server'
import { parseOttoWorkbook } from '@/lib/imports/otto-parser'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const MAX_FILE_SIZE = 15 * 1024 * 1024

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase no está configurado.' }, { status: 503 })
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Sesión vencida.' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    return NextResponse.json({ error: 'No tenés permiso para importar.' }, { status: 403 })
  }

  const form = await request.formData()
  const file = form.get('file')

  if (!(file instanceof File) || !file.name.toLowerCase().endsWith('.xlsx')) {
    return NextResponse.json({ error: 'Elegí un archivo Excel .xlsx.' }, { status: 400 })
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'El archivo supera el límite de 15 MB.' }, { status: 413 })
  }

  try {
    const result = await parseOttoWorkbook(await file.arrayBuffer())
    return NextResponse.json({
      fileName: file.name,
      summary: result.summary,
      sample: result.rows.slice(0, 12).map((row) => ({
        rowNumber: row.rowNumber,
        rawName: row.rawName,
        brandCandidate: row.brandCandidate,
        stockQuantity: row.stockQuantity,
        purchasePrice: row.purchasePrice,
        packagePrice: row.packagePrice,
        status: row.status,
      })),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No pudimos leer el Excel.' },
      { status: 422 },
    )
  }
}
