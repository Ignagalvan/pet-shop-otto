'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireStaff } from '@/lib/supabase/staff'

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
