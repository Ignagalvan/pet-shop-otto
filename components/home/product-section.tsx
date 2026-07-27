import type { Product } from "@/lib/types"
import { SectionHeading } from "../section-heading"
import { ProductCarousel } from "../product-carousel"

export function ProductSection({
  eyebrow,
  title,
  description,
  href,
  products,
}: {
  eyebrow?: string
  title: string
  description?: string
  href?: string
  products: Product[]
}) {
  if (products.length === 0) return null
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 md:py-10">
      <SectionHeading eyebrow={eyebrow} title={title} description={description} href={href} />
      <ProductCarousel products={products} />
    </section>
  )
}
