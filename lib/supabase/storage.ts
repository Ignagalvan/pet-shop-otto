const PRODUCT_IMAGES_BUCKET = 'product-images'

export function getProductImageUrl(path: string | null | undefined) {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!path || !projectUrl) return null

  const encodedPath = path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')

  return `${projectUrl}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${encodedPath}`
}

export { PRODUCT_IMAGES_BUCKET }
