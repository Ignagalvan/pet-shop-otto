import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProductDetailClient } from '@/components/product-detail-client'
import { getPublicProduct, getRelatedProducts } from '@/lib/catalog'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const product = await getPublicProduct(slug)
  return product
    ? { title: product.name, description: product.description }
    : { title: 'Producto no encontrado' }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getPublicProduct(slug)
  if (!product) notFound()
  const related = await getRelatedProducts(product)
  return <ProductDetailClient product={product} related={related} />
}
