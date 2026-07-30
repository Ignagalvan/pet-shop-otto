import { NextResponse } from 'next/server'
import { getPublicProducts } from '@/lib/catalog'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q')?.trim().toLocaleLowerCase('es') ?? ''
  if (query.length < 2) return NextResponse.json([])

  const products = await getPublicProducts()
  const matches = products
    .filter((product) =>
      `${product.name} ${product.brand} ${product.category}`
        .toLocaleLowerCase('es')
        .includes(query),
    )
    .slice(0, 5)

  return NextResponse.json(matches)
}
