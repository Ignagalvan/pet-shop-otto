'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireStaff } from '@/lib/supabase/staff'
import { publicationMissingFields } from '@/lib/product-publication'

export async function manageLooseStockAction(form:FormData) {
  const {supabase}=await requireStaff()
  const productId=z.uuid().parse(form.get('productId'))
  const price=z.coerce.number().positive().max(100000000).parse(form.get('pricePerKg'))
  const opening=form.get('operation')==='open'
  const result=opening ? await supabase.rpc('open_product_bags',{
    p_variant_id:z.uuid().parse(form.get('variantId')),
    p_bags:z.coerce.number().int().positive().max(1000).parse(form.get('bags')),
    p_price_per_kg:price,
    p_operation_id:z.uuid().parse(form.get('operationId')),
  }) : await supabase.rpc('set_loose_inventory',{
    p_product_id:productId,
    p_quantity_kg:z.coerce.number().min(0).max(1000000).parse(form.get('quantityKg')),
    p_price_per_kg:price,
  })
  if(result.error) redirect(`/admin/productos/${productId}?error=${encodeURIComponent(result.error.message)}`)
  for(const path of ['/admin','/admin/productos','/','/productos']) revalidatePath(path)
  revalidatePath('/producto/[slug]','page')
  revalidatePath(`/admin/productos/${productId}`)
  redirect(`/admin/productos/${productId}?guardado=1`)
}

export async function setProductPublicationAction(ids: string[], published: boolean) {
  const parsed = z.object({ ids: z.array(z.uuid()).min(1).max(30), published: z.boolean() }).safeParse({ ids, published })
  if (!parsed.success) return { updated: 0, blocked: [], error: 'Seleccioná entre 1 y 30 productos de esta página.' }
  const { supabase } = await requireStaff()
  const uniqueIds = [...new Set(parsed.data.ids)]
  const { data, error } = await supabase.from('products').select('id, name, image_path, description, category_id, product_pet_types(pet_type_id), product_variants(active, sells_by_package, sells_by_kg, package_price, kg_price)').in('id', uniqueIds)
  if (error || !data || data.length !== uniqueIds.length) return { updated: 0, blocked: [], error: 'No pudimos verificar todos los productos. Recargá e intentá nuevamente.' }
  const blocked = published ? data.flatMap(product => {
    const missing = publicationMissingFields(product)
    return missing.length ? [{ id: product.id, name: product.name, reason: `Falta: ${missing.join(', ')}.` }] : []
  }) : []
  const blockedIds = new Set(blocked.map(product => product.id))
  const allowed = uniqueIds.filter(id => !blockedIds.has(id))
  if (allowed.length) {
    const changes = published ? { published: true, active: true } : { published: false }
    const result = await supabase.from('products').update(changes).in('id', allowed).select('id')
    if (result.error || result.data?.length !== allowed.length) return { updated: 0, blocked, error: 'No pudimos guardar la visibilidad. Recargá para comprobar el estado.' }
    for (const path of ['/admin', '/admin/productos', '/', '/productos', '/favoritos']) revalidatePath(path)
    revalidatePath('/admin/productos/[id]', 'page')
    revalidatePath('/producto/[slug]', 'page')
  }
  return { updated: allowed.length, blocked, error: null }
}

const productSchema = z.object({
  productId: z.uuid(),
  variantId: z.uuid(),
  name: z.string().trim().min(2).max(180),
  description: z.string().trim().max(4000),
  brandId: z.string().regex(/^\d+$/),
  categoryId: z.string().regex(/^\d+$/),
  presentation: z.string().trim().max(80),
  packageWeightKg: z.string(),
  purchaseCost: z.coerce.number().min(0),
  packagePrice: z.coerce.number().min(0),
  kgPrice: z.string(),
  stockQuantity: z.coerce.number().min(0),
  packageMarginPercent: z.string(),
  kgMarginPercent: z.string(),
})

function optionalNumber(value: string) {
  const normalized = value.trim().replace(',', '.')
  if (!normalized) return ''
  const parsed = Number(normalized)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : ''
}

export async function updateProductAction(formData: FormData) {
  const values = productSchema.parse({
    productId: formData.get('productId'),
    variantId: formData.get('variantId'),
    name: formData.get('name'),
    description: formData.get('description') ?? '',
    brandId: formData.get('brandId'),
    categoryId: formData.get('categoryId'),
    presentation: formData.get('presentation') ?? '',
    packageWeightKg: formData.get('packageWeightKg') ?? '',
    purchaseCost: formData.get('purchaseCost'),
    packagePrice: formData.get('packagePrice'),
    kgPrice: formData.get('kgPrice') ?? '',
    stockQuantity: formData.get('stockQuantity'),
    packageMarginPercent: formData.get('packageMarginPercent') ?? '',
    kgMarginPercent: formData.get('kgMarginPercent') ?? '',
  })

  const { supabase, profile } = await requireStaff()
  if (!profile) throw new Error('No tenés permiso para editar productos.')

  const petTypeIds = formData
    .getAll('petTypeId')
    .map(String)
    .filter((value) => /^\d+$/.test(value))

  const { error } = await supabase.rpc('update_admin_product', {
    p_product_id: values.productId,
    p_variant_id: values.variantId,
    p_data: {
      name: values.name,
      description: values.description,
      brandId: values.brandId,
      categoryId: values.categoryId,
      presentation: values.presentation,
      packageWeightKg: optionalNumber(values.packageWeightKg),
      purchaseCost: values.purchaseCost,
      packagePrice: values.packagePrice,
      kgPrice: optionalNumber(values.kgPrice),
      stockQuantity: values.stockQuantity,
      packageMarginPercent: optionalNumber(values.packageMarginPercent),
      kgMarginPercent: optionalNumber(values.kgMarginPercent),
      sellsByKg: formData.get('sellsByKg') === 'on',
      published: formData.get('published') === 'on',
      featured: formData.get('featured') === 'on',
      onRequest: formData.get('onRequest') === 'on',
      petTypeIds,
    },
  })

  if (error) {
    redirect(
      `/admin/productos/${values.productId}?error=${encodeURIComponent(error.message)}`,
    )
  }

  revalidatePath('/admin')
  revalidatePath('/admin/productos')
  revalidatePath(`/admin/productos/${values.productId}`)
  revalidatePath('/')
  revalidatePath('/productos')
  revalidatePath('/favoritos')
  revalidatePath('/producto/[slug]', 'page')
  redirect(`/admin/productos/${values.productId}?guardado=1`)
}
