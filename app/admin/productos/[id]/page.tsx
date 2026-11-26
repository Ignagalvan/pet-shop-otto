import Link from 'next/link'
import { AlertTriangle, ArrowLeft, CheckCircle2, ExternalLink, Save } from 'lucide-react'
import { notFound } from 'next/navigation'
import { ProductImageUploader } from '@/components/admin/product-image-uploader'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { updateProductAction, manageLooseStockAction } from '../actions'
import { randomUUID } from 'node:crypto'
import { ProductPricingFields } from '@/components/admin/product-pricing-fields'

export const metadata = { title: 'Editar producto' }

type ProductRecord = {
  loose_inventory: {quantity_kg:number;price_per_kg:number} | null
  id: string
  slug: string
  name: string
  description: string | null
  published: boolean
  featured: boolean
  on_request: boolean
  image_path: string | null
  brand_id: number | null
  category_id: number | null
  product_pet_types: Array<{ pet_type_id: number }>
  product_variants: Array<{
    id: string
    presentation: string | null
    package_weight_kg: number | null
    package_price: number | null
    kg_price: number | null
    sells_by_kg: boolean
    stock_status: string
    inventory: { quantity: number } | null
    variant_costs: {
      purchase_cost: number
      package_margin_percent: number | null
      kg_margin_percent: number | null
      rounding_step: number
    } | null
  }>
}

type Option = { id: number; name: string }

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ guardado?: string; error?: string }>
}) {
  const { id } = await params
  const { guardado, error } = await searchParams
  const supabase = await createSupabaseServerClient()

  const [productResult, brandsResult, categoriesResult, petTypesResult] = await Promise.all([
    supabase
      .from('products')
      .select(
        `
          id,
          loose_inventory(quantity_kg,price_per_kg),
          slug,
          name,
          description,
          published,
          featured,
          on_request,
          image_path,
          brand_id,
          category_id,
          product_pet_types ( pet_type_id ),
          product_variants (
            id,
            presentation,
            package_weight_kg,
            package_price,
            kg_price,
            sells_by_kg,
            stock_status,
            inventory ( quantity ),
            variant_costs (
              purchase_cost,
              package_margin_percent,
              kg_margin_percent,
              rounding_step
            )
          )
        `,
      )
      .eq('id', id)
      .maybeSingle(),
    supabase.from('brands').select('id, name').order('name'),
    supabase.from('categories').select('id, name').order('sort_order').order('name'),
    supabase.from('pet_types').select('id, name').order('sort_order').order('name'),
  ])

  if (!productResult.data) notFound()

  const product = productResult.data as unknown as ProductRecord
  const variant = product.product_variants[0]
  if (!variant) notFound()

  const brands = (brandsResult.data ?? []) as Option[]
  const categories = (categoriesResult.data ?? []) as Option[]
  const petTypes = (petTypesResult.data ?? []) as Option[]
  const selectedPetTypes = new Set(
    product.product_pet_types.map((item) => item.pet_type_id),
  )

  const inputClass =
    'mt-1.5 h-11 w-full rounded-xl border bg-white px-3 outline-none transition focus:border-primary focus:ring-3 focus:ring-primary/10'
  const labelClass = 'block text-sm font-extrabold text-foreground/80'

  return (
    <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
      <Link
        href="/admin/productos"
        className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
      >
        <ArrowLeft className="size-4" />
        Volver a productos
      </Link>

      <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brown">
            Editar producto
          </p>
          <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">{product.name}</h1>
        </div>
        {guardado === '1' && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-success/10 px-4 py-2 text-sm font-bold text-success">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="size-5" />
              Cambios guardados
            </span>
            {product.published && (
              <Link
                href={`/producto/${product.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs text-primary shadow-sm transition hover:bg-primary hover:text-white"
              >
                Ver en la tienda
                <ExternalLink className="size-3.5" />
              </Link>
            )}
          </div>
        )}
        {error && (
          <div className="inline-flex max-w-xl items-start gap-2 rounded-xl bg-destructive/10 px-4 py-2 text-sm font-bold text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            {error}
          </div>
        )}
      </div>

      <form action={updateProductAction} className="mt-6 grid gap-5 xl:grid-cols-[1fr_340px]">
        <input type="hidden" name="productId" value={product.id} />
        <input type="hidden" name="variantId" value={variant.id} />

        <div className="space-y-5">
          <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-extrabold">Información principal</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className={`${labelClass} sm:col-span-2`}>
                Nombre
                <input name="name" defaultValue={product.name} required className={inputClass} />
              </label>
              <label className={labelClass}>
                Marca
                <select name="brandId" defaultValue={product.brand_id ?? ''} required className={inputClass}>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                Categoría
                <select name="categoryId" defaultValue={product.category_id ?? ''} required className={inputClass}>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </label>
              <label className={`${labelClass} sm:col-span-2`}>
                Descripción
                <textarea
                  name="description"
                  defaultValue={product.description ?? ''}
                  rows={5}
                  className="mt-1.5 w-full rounded-xl border bg-white p-3 outline-none transition focus:border-primary focus:ring-3 focus:ring-primary/10"
                  placeholder="Contá para qué mascota sirve, beneficios y características…"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-extrabold">Precios y stock</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className={labelClass}>
                Presentación
                <input name="presentation" defaultValue={variant.presentation ?? ''} className={inputClass} placeholder="Ej: 15 kg" />
              </label>
              <label className={labelClass}>
                Bolsas / unidades cerradas
                <input name="stockQuantity" type="number" min="0" step="1" required defaultValue={variant.inventory?.quantity ?? 0} className={inputClass} />
              </label>
              <ProductPricingFields key={variant.id} initial={{
                cost: Number(variant.variant_costs?.purchase_cost ?? 0),
                weight: variant.package_weight_kg,
                packagePrice: variant.package_price,
                kgPrice: Number(product.loose_inventory?.price_per_kg) || variant.kg_price,
                packageMargin: variant.variant_costs?.package_margin_percent ?? null,
                kgMargin: variant.variant_costs?.kg_margin_percent ?? null,
                roundingStep: Number(variant.variant_costs?.rounding_step ?? 100),
                sellsByKg: variant.sells_by_kg,
              }}/>
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-extrabold">¿Para qué mascotas?</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {petTypes.map((petType) => (
                <label key={petType.id} className="flex cursor-pointer items-center gap-2 rounded-xl border bg-background px-3 py-2 text-sm font-bold">
                  <input
                    type="checkbox"
                    name="petTypeId"
                    value={petType.id}
                    defaultChecked={selectedPetTypes.has(petType.id)}
                    className="size-4 accent-primary"
                  />
                  {petType.name}
                </label>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <ProductImageUploader
            productId={product.id}
            productName={product.name}
            initialImagePath={product.image_path}
          />

          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="font-extrabold">Visibilidad</h2>
            <div className="mt-4 space-y-3">
              <label className="flex items-start gap-3 rounded-xl border p-3 text-sm">
                <input
                  name="published"
                  type="checkbox"
                  defaultChecked={product.published}
                  disabled={!product.image_path}
                  className="mt-0.5 size-4 accent-success disabled:opacity-40"
                />
                <span>
                  <strong className="block">Publicado</strong>
                  {product.image_path
                    ? 'Visible para los clientes.'
                    : 'Primero agregá una imagen.'}
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-xl border p-3 text-sm">
                <input name="featured" type="checkbox" defaultChecked={product.featured} className="mt-0.5 size-4 accent-primary" />
                <span><strong className="block">Destacado</strong>Aparece en selecciones especiales.</span>
              </label>
              <label className="flex items-start gap-3 rounded-xl border p-3 text-sm">
                <input name="onRequest" type="checkbox" defaultChecked={product.on_request} className="mt-0.5 size-4 accent-brown" />
                <span><strong className="block">Producto a pedido</strong>Permite solicitarlo sin stock inmediato.</span>
              </label>
            </div>
            <p className="mt-4 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
              Para publicar se requiere foto, descripción, precio, categoría y al menos una mascota.
            </p>
          </section>

          <button className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-success px-5 font-extrabold text-white shadow-sm transition hover:bg-success/90">
            <Save className="size-5" />
            Guardar cambios
          </button>
        </aside>
      </form>
      {variant.sells_by_kg && <section className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-extrabold">Bolsas cerradas y suelto</h2>
        <p className="mt-2 text-sm">Cerradas de esta presentación: <strong>{Number(variant.inventory?.quantity??0).toLocaleString('es-AR')}</strong>. Suelto del mismo alimento: <strong>{Number(product.loose_inventory?.quantity_kg??0).toLocaleString('es-AR')} kg</strong>.</p>
        <p className="mt-2 text-sm text-muted-foreground">El suelto se comparte entre las presentaciones del mismo alimento. Abrir una bolsa resta una unidad cerrada y suma su peso en kilos. No se abre automáticamente al comprar.</p>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <form action={manageLooseStockAction} className="rounded-xl border p-4">
            <input type="hidden" name="productId" value={product.id}/><input type="hidden" name="variantId" value={variant.id}/><input type="hidden" name="operation" value="open"/><input type="hidden" name="operationId" value={randomUUID()}/>
            <h3 className="font-bold">Abrir bolsas de {variant.presentation}</h3>
            <label className={`${labelClass} mt-3`}>Cantidad de bolsas a abrir<input name="bags" type="number" min="1" step="1" max={Math.floor(Number(variant.inventory?.quantity??0))} defaultValue="1" required className={inputClass}/></label>
            <label className={`${labelClass} mt-3`}>Precio de venta de 1 kg suelto<input name="pricePerKg" type="number" min="0.01" step="0.01" defaultValue={Number(product.loose_inventory?.price_per_kg)||variant.kg_price||''} required className={inputClass}/></label>
            <button disabled={Number(variant.inventory?.quantity??0)<1} className="mt-4 min-h-11 rounded-xl bg-primary px-4 font-bold text-white disabled:opacity-40">Registrar apertura de bolsas</button>
          </form>
          <form action={manageLooseStockAction} className="rounded-xl border p-4">
            <input type="hidden" name="productId" value={product.id}/><input type="hidden" name="operation" value="adjust"/>
            <h3 className="font-bold">Registrar los kilos abiertos reales</h3>
            <p className="mt-2 text-sm text-muted-foreground">Usá esta opción para el saldo inicial o una corrección. Reemplaza los kilos sueltos; no descuenta bolsas cerradas.</p>
            <label className={`${labelClass} mt-3`}>Kilos sueltos disponibles<input name="quantityKg" type="number" min="0" step="0.001" defaultValue={product.loose_inventory?.quantity_kg??0} required className={inputClass}/></label>
            <label className={`${labelClass} mt-3`}>Precio de venta de 1 kg suelto<input name="pricePerKg" type="number" min="0.01" step="0.01" defaultValue={Number(product.loose_inventory?.price_per_kg)||variant.kg_price||''} required className={inputClass}/></label>
            <button className="mt-4 min-h-11 rounded-xl border border-primary px-4 font-bold text-primary">Guardar saldo real de suelto</button>
          </form>
        </div>
      </section>}
    </div>
  )
}
