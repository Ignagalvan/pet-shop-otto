import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it, vi } from 'vitest'
import type { Product } from '../lib/types'

vi.mock('./store-provider', () => ({useStore: () => ({
  addToCart: vi.fn(), toggleFavorite: vi.fn(), isFavorite: () => false,
  items: [],
  settings: {whatsappNumber: '5493512345678'},
})}))
vi.mock('./toast-provider', () => ({useToast: () => ({toast: vi.fn()})}))
vi.mock('next/navigation', () => ({useRouter: () => ({push: vi.fn()})}))
import { ProductCarousel } from './product-carousel'
import { ProductDetailClient } from './product-detail-client'

it('permite ambos gestos, explica las opciones y consulta solo por el producto', () => {
  const product: Product = {
    id: 'fixture', slug: 'alimento-prueba', name: 'Alimento de prueba',
    brand: 'Prueba', image: '/placeholder.svg', tags: [], reviewsCount: 0,
    petTypes: ['gatos'], category: 'alimentos', lifeStage: 'adulto', rating: 0,
    description: 'Solo fixture aislado.', benefits: [], features: [],
    price: 10000, stock: 'disponible', presentation: 'Elegí bolsa cerrada o suelto',
    variants: [{id: 'bag', label: '10 kg', mode: 'package', price: 10000},
      {id: 'loose:kg', label: 'Suelto', mode: 'kg', price: 1500}],
  }
  const html = renderToStaticMarkup(<ProductCarousel products={[product]}/> )
  expect(html).toContain('touch-auto')
  expect(html).not.toContain('touch-pan-x')
  expect(html).toContain('Ver opciones de compra')
  expect(html).toContain('/producto/alimento-prueba')
  const url = html.match(/href="(https:\/\/wa\.me\/[^\"]+)"/)?.[1]
  expect(url).toBeDefined()
  expect(new URL(url!).searchParams.get('text')).toBe('Hola! Quiero consultar por el producto "Alimento de prueba".')
})

it('muestra compra normal y encargo adicional a la vez cuando hay stock', () => {
  const product: Product={id:'fixture',slug:'alimento',name:'Alimento',brand:'Prueba',image:'/placeholder.svg',tags:[],reviewsCount:0,petTypes:['gatos'],category:'alimentos',lifeStage:'adulto',rating:0,description:'Prueba aislada',benefits:[],features:[],price:10000,stock:'disponible',presentation:'10 kg',acceptsBackorder:true,defaultVariantId:'bag',variants:[{id:'bag',label:'10 kg',price:10000,mode:'package',stockCount:3,acceptsBackorder:true}]}
  const html=renderToStaticMarkup(<ProductDetailClient product={product} related={[]}/> )
  expect(html).toContain('Agregar al carrito')
  expect(html).toContain('Comprar ahora')
  expect(html).toContain('Encargar cantidad adicional')
  const soldOut=renderToStaticMarkup(<ProductDetailClient product={{...product,stock:'pedido',variants:[{...product.variants![0],stockCount:0}]}} related={[]}/> )
  expect(soldOut).toContain('Encargar producto')
  expect(soldOut).not.toContain('Agregar al carrito')
  const disabled=renderToStaticMarkup(<ProductDetailClient product={{...product,stock:'agotado',acceptsBackorder:false,variants:[{...product.variants![0],stockCount:0,acceptsBackorder:false}]}} related={[]}/> )
  expect(disabled).not.toContain('Encargar producto')
})
