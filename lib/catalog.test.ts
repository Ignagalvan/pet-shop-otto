import { expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
const { rows } = vi.hoisted(() => ({ rows: [] as unknown[] }))
vi.mock('./supabase/server', () => ({
  createSupabaseServerClient: async () => ({
    from: () => {
      const query = {
        select: () => query,
        eq: () => query,
        order: () => query,
        then: (resolve: (result: unknown) => void) => resolve({ data: rows, error: null }),
      }
      return query
    },
  }),
}))
import { getPublicProduct, getPublicProducts } from './catalog'

it('agrupa tamaños sin duplicar el suelto, conserva enlaces y elige una presentación disponible', async () => {
  rows.push(...[10, 20].map((kg, i) => ({
    id: `product-${i}`, name: `AGILITY GATO ADULTO ${kg}KG`, slug: `agility-${kg}`,
    stock_group_key: 'same-food', loose_inventory: {quantity_kg: 0.5, price_per_kg: 1500},
    brands: {name: 'Agility'}, categories: {slug: 'alimentos'},
    product_pet_types: [{pet_types: {slug: 'gatos'}}],
    product_variants: [{id: `variant-${i}`, presentation: `${kg} kg`, package_weight_kg: kg,
      package_price: kg * 1000, kg_price: 999, sells_by_kg: true, sells_by_package: true,
      inventory: {quantity: 0}, stock_status: 'out_of_stock'}],
  })))
  const products = await getPublicProducts()
  expect(products).toHaveLength(1)
  expect(products[0].name).toBe('AGILITY GATO ADULTO')
  expect(products[0].variants).toHaveLength(3)
  expect(products[0].variants?.filter(v => v.mode === 'kg')).toEqual([
    expect.objectContaining({label: 'Suelto', price: 1500, stockCount: 0.5}),
  ])
  expect(products[0].defaultSaleMode).toBe('kg')
  expect(products[0].stock).toBe('disponible')
  expect((await getPublicProduct('agility-20'))?.id).toBe(products[0].id)
})
