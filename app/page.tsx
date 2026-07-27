import { CategoryGrid } from '@/components/home/category-grid'
import { Hero } from '@/components/home/hero'
import { ProductSection } from '@/components/home/product-section'
import { PromoBanners } from '@/components/home/promo-banners'
import { ShopByCategory } from '@/components/home/shop-by-category'
import { TrustNewsletter } from '@/components/home/trust-newsletter'
import { getFeatured, getOffers } from '@/lib/data'

export default function HomePage() {
  const featuredProducts = getFeatured()
  const offerProducts = getOffers()

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
      <ShopByCategory />
      <ProductSection
        eyebrow="Precios especiales"
        title="Ofertas que valen la pena"
        description="Aprovechá promociones seleccionadas por tiempo limitado."
        href="/productos?oferta=1"
        products={offerProducts}
      />
      <TrustNewsletter />
    </>
  )
}
