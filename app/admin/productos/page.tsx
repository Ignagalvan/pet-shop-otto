import Image from 'next/image'
import Link from 'next/link'
import { ImageOff, PackageSearch, Pencil, Search } from 'lucide-react'
import { ProductPagination } from '@/components/admin/product-pagination'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getProductImageUrl } from '@/lib/supabase/storage'

export const metadata = { title: 'Administrar productos' }

const PAGE_SIZE = 30

type AdminProduct = {
  id: string
  name: string
  image_path: string | null
  published: boolean
  active: boolean
  featured: boolean
  on_request: boolean
  brands: { name: string } | null
  categories: { name: string } | null
  product_variants: Array<{
    id: string
    presentation: string | null
    package_price: number | null
    kg_price: number | null
    stock_status: 'available' | 'low' | 'out_of_stock' | 'on_request'
    inventory: { quantity: number } | null
    variant_costs: { purchase_cost: number } | null
  }>
}

const currency = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 2,
})

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string; pagina?: string }>
}) {
  const params = await searchParams
  const query = params.q?.trim() ?? ''
  const status = params.estado ?? 'todos'
  const requestedPage = Math.max(Number(params.pagina) || 1, 1)
  const supabase = await createSupabaseServerClient()

  const variantRelation =
    status === 'sin-stock' || status === 'stock-bajo'
      ? 'product_variants!inner'
      : 'product_variants'

  let productsQuery = supabase
    .from('products')
    .select(
      `
        id,
        name,
        image_path,
        published,
        active,
        featured,
        on_request,
        brands ( name ),
        categories ( name ),
        ${variantRelation} (
          id,
          presentation,
          package_price,
          kg_price,
          stock_status,
          inventory ( quantity ),
          variant_costs ( purchase_cost )
        )
      `,
      { count: 'exact' },
    )
    .order('name')

  if (query) productsQuery = productsQuery.ilike('name', `%${query}%`)
  if (status === 'publicados') productsQuery = productsQuery.eq('published', true)
  if (status === 'borradores') productsQuery = productsQuery.eq('published', false)
  if (status === 'sin-imagen') productsQuery = productsQuery.is('image_path', null)
  if (status === 'con-imagen') {
    productsQuery = productsQuery.not('image_path', 'is', null)
  }
  if (status === 'sin-stock') {
    productsQuery = productsQuery.eq('product_variants.stock_status', 'out_of_stock')
  }
  if (status === 'stock-bajo') {
    productsQuery = productsQuery.eq('product_variants.stock_status', 'low')
  }

  const start = (requestedPage - 1) * PAGE_SIZE
  const { data, count, error } = await productsQuery.range(start, start + PAGE_SIZE - 1)

  if (error) {
    return (
      <div className="m-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-destructive">
        No pudimos cargar el catálogo: {error.message}
      </div>
    )
  }

  const products = (data ?? []) as unknown as AdminProduct[]
  const total = count ?? 0
  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1)
  const page = Math.min(requestedPage, totalPages)

  return (
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
      <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brown">Catálogo</p>
      <h1 className="mt-2 text-3xl font-extrabold">Productos</h1>
      <p className="mt-1 text-muted-foreground">
        {total.toLocaleString('es-AR')} resultados encontrados.
      </p>

      <form className="mt-6 grid gap-3 rounded-2xl border bg-white p-4 shadow-sm md:grid-cols-[1fr_220px_auto]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Buscar por nombre…"
            className="h-11 w-full rounded-xl border bg-background pl-10 pr-4 outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
          />
        </label>
        <select
          name="estado"
          defaultValue={status}
          className="h-11 rounded-xl border bg-background px-3 outline-none focus:border-primary"
        >
          <option value="todos">Todos los productos</option>
          <option value="borradores">Sin publicar</option>
          <option value="publicados">Publicados</option>
          <option value="sin-imagen">Sin imagen</option>
          <option value="con-imagen">Con imagen</option>
          <option value="sin-stock">Sin stock</option>
          <option value="stock-bajo">Stock bajo</option>
        </select>
        <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 font-bold text-white">
          <PackageSearch className="size-4" />
          Filtrar
        </button>
      </form>

      <div className="mt-5 overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="hidden grid-cols-[minmax(280px,1.5fr)_150px_110px_130px_120px_52px] gap-4 border-b bg-muted/55 px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-muted-foreground lg:grid">
          <span>Producto</span>
          <span>Marca</span>
          <span>Stock</span>
          <span>Venta</span>
          <span>Estado</span>
          <span />
        </div>

        {products.length ? (
          <div className="divide-y">
            {products.map((product) => {
              const variant = product.product_variants[0]
              const stock = variant?.inventory?.quantity ?? 0
              const imageUrl = getProductImageUrl(product.image_path)
              return (
                <article
                  key={product.id}
                  className="grid gap-3 p-4 transition hover:bg-primary/[0.025] lg:grid-cols-[minmax(280px,1.5fr)_150px_110px_130px_120px_52px] lg:items-center lg:gap-4 lg:px-5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-background">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-contain"
                        />
                      ) : (
                        <ImageOff className="size-5 text-muted-foreground/55" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-extrabold">{product.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {variant?.presentation || product.categories?.name || 'Sin presentación'}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm">
                    <span className="mr-1 text-xs text-muted-foreground lg:hidden">Marca:</span>
                    {product.brands?.name || 'Sin marca'}
                  </p>
                  <p className="text-sm font-bold">
                    <span
                      className={`mr-2 inline-block size-2 rounded-full ${
                        stock <= 0 ? 'bg-promo' : stock <= 3 ? 'bg-amber-500' : 'bg-success'
                      }`}
                    />
                    {stock.toLocaleString('es-AR')}
                  </p>
                  <p className="font-extrabold">
                    {variant?.package_price === null || variant?.package_price === undefined
                      ? '—'
                      : currency.format(variant.package_price)}
                  </p>
                  <div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-extrabold ${
                        product.published
                          ? 'bg-success/10 text-success'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {product.published ? 'Publicado' : 'Borrador'}
                    </span>
                  </div>
                  <Link
                    href={`/admin/productos/${product.id}`}
                    className="inline-flex size-10 items-center justify-center rounded-xl border text-primary transition hover:bg-primary hover:text-white"
                    aria-label={`Editar ${product.name}`}
                  >
                    <Pencil className="size-4" />
                  </Link>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="p-10 text-center text-muted-foreground">
            No encontramos productos con esos filtros.
          </div>
        )}
      </div>

      <ProductPagination
        currentPage={page}
        totalPages={totalPages}
        query={query}
        status={status}
      />
    </div>
  )
}
