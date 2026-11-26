import { expect, it } from 'vitest'
import { publicationMissingFields, type PublicationProduct } from './product-publication'

const ready: PublicationProduct = {image_path:'foto.webp', description:'Alimento', category_id:1, product_pet_types:[{pet_type_id:1}], product_variants:[{active:true,sells_by_package:true,sells_by_kg:false,package_price:100,kg_price:null}]}
it('permite publicar productos completos sin inventar stock', () => {
  expect(publicationMissingFields(ready)).toEqual([])
})
it('informa todos los datos faltantes y rechaza precios de variantes inactivas', () => {
  expect(publicationMissingFields({...ready,image_path:' ',description:'',category_id:null,product_pet_types:[],product_variants:[{...ready.product_variants[0],active:false}]})).toEqual(['foto','descripción','categoría','mascota','precio de venta'])
})
it('reconoce venta por kilo y rechaza precios cero', () => {
  expect(publicationMissingFields({...ready,product_variants:[{...ready.product_variants[0],sells_by_package:false,sells_by_kg:true,kg_price:50}]})).toEqual([])
  expect(publicationMissingFields({...ready,product_variants:[{...ready.product_variants[0],package_price:0}]})).toEqual(['precio de venta'])
})
