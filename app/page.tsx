import { CategoryGrid } from '@/components/home/category-grid'
import { Hero } from '@/components/home/hero'
import { ProductSection } from '@/components/home/product-section'
import { PromoBanners } from '@/components/home/promo-banners'
import { TrustNewsletter } from '@/components/home/trust-newsletter'
import { getPublicProducts } from '@/lib/catalog'

export default async function HomePage() {
  const products = await getPublicProducts()
  const selectedProducts = products.filter((product) => product.featured)
  const featuredProducts = selectedProducts.length ? selectedProducts : products.slice(0, 8)
  const offerProducts = products.filter((product) => product.tags.includes('oferta'))
  const brands = [...new Set(products.map((product) => product.brand))].slice(0, 12)

  return (
    <>
      <Hero />
      <CategoryGrid />
      <ProductSection
        eyebrow="Los elegidos de la comunidad"
        title="Productos destacados"
        description="Una selección de favoritos para cuidar y mimar a tu mascota."
        href="/productos"
        products={featuredProducts}
      />
      <PromoBanners />
      <ProductSection
        eyebrow="Precios especiales"
        title="Ofertas que valen la pena"
        description="Aprovechá promociones seleccionadas por tiempo limitado."
        href="/productos?oferta=1"
        products={offerProducts}
      />
      <TrustNewsletter brands={brands} />
    </>
  )
}
