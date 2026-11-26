import { PGlite } from '@electric-sql/pglite'
import fs from 'node:fs/promises'
import { expect, it } from 'vitest'

it('separa bolsas y suelto, apertura, compras, reintentos y cancelaciones en PostgreSQL aislado', async () => {
 const db=new PGlite()
 try {
 await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key,email text);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid,bucket_id text);create publication supabase_realtime;`)
 const files=(await fs.readdir('supabase/migrations')).filter(f=>f.endsWith('.sql')&&!/verify|clear_test|disable_unverified|batch_product|publish_ready|product_descriptions|complete_ready/.test(f)).sort()
 for(const file of files){
  const sql=(await fs.readFile(`supabase/migrations/${file}`,'utf8')).replaceAll('\r\n','\n').replace('create extension if not exists pgcrypto;','')
  try{await db.exec(sql)}catch(e){throw new Error(`Migración ${file}: ${String(e)}`)}
 }
 await db.exec(`insert into auth.users(id,email) values('00000000-0000-4000-8000-000000000001','isolated@example.invalid');insert into public.profiles(id,role) values('00000000-0000-4000-8000-000000000001','owner');select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);insert into public.products(id,name,slug) values('00000000-0000-4000-8000-000000000002','ALIMENTO PERRO 10KG','alimento-perro-10kg');insert into public.product_variants(id,product_id,presentation,package_weight_kg,package_price,kg_price,sells_by_kg) values('00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000002','10 kg',10,10000,1500,true);insert into public.inventory(variant_id,quantity) values('00000000-0000-4000-8000-000000000003',3);`)
 const state=async()=> (await db.query<{closed:string;loose:string}>(`select i.quantity::text closed,l.quantity_kg::text loose from inventory i join product_variants v on v.id=i.variant_id join products p on p.id=v.product_id join loose_inventory l using(stock_group_key)`)).rows[0]
 expect(await state()).toEqual({closed:'3.000',loose:'0.000'})
 const opening=`select open_product_bags('00000000-0000-4000-8000-000000000003',1,1500,'00000000-0000-4000-8000-000000000010')`
 await db.exec(opening)
 await db.exec(opening)
 expect(await state()).toEqual({closed:'2.000',loose:'10.000'})
 await db.exec(`insert into categories(name,slug) values('Alimentos','alimentos');insert into pet_types(name,slug) values('Perros','perros');`)
 const [{id:category}]=(await db.query<{id:number}>(`select id from categories limit 1`)).rows
 const [{id:pet}]=(await db.query<{id:number}>(`select id from pet_types limit 1`)).rows
 await db.exec(`insert into brands(name,slug) values('Prueba','prueba');insert into product_pet_types values('00000000-0000-4000-8000-000000000002',${pet});update products set image_path='test.webp',description='Solo prueba local',category_id=${category},brand_id=(select id from brands limit 1),published=true;`)
 const checkout=`select create_public_order('00000000-0000-4000-8000-000000000004','{"name":"Prueba aislada","phone":"0000000000"}','{"type":"retiro"}','local','[{"variantId":"00000000-0000-4000-8000-000000000003","mode":"kg","quantity":0.5},{"variantId":"00000000-0000-4000-8000-000000000003","mode":"package","quantity":1}]') as result`
 const order=(await db.query<{result:{id:string;subtotal:number}}>(checkout)).rows[0].result
 expect(Number(order.subtotal)).toBe(10750)
 expect(await state()).toEqual({closed:'1.000',loose:'9.500'})
 await db.query(checkout)
 expect(await state()).toEqual({closed:'1.000',loose:'9.500'})
 await db.exec(`select update_order_status('${order.id}','cancelled');select update_order_status('${order.id}','cancelled');`)
 expect(await state()).toEqual({closed:'2.000',loose:'10.000'})
 await db.exec(`select update_order_status('${order.id}','pending')`)
 expect(await state()).toEqual({closed:'1.000',loose:'9.500'})
 await expect(db.exec(`select open_product_bags('00000000-0000-4000-8000-000000000003',2,1500)`)).rejects.toThrow()
 await db.exec(`select set_loose_inventory('00000000-0000-4000-8000-000000000002',0,1500)`)
 await expect(db.query(checkout.replace('000000000004','000000000005'))).rejects.toThrow()
 expect(await state()).toEqual({closed:'1.000',loose:'0.000'})
 // A second bag size shares exactly the same loose balance; no duplicate pool.
 await db.exec(`insert into products(id,name,slug,description,image_path,category_id,brand_id) select '00000000-0000-4000-8000-000000000006','ALIMENTO PERRO 20KG','alimento-perro-20kg',description,image_path,category_id,brand_id from products limit 1;insert into product_variants(id,product_id,presentation,package_weight_kg,package_price,kg_price,sells_by_kg) values('00000000-0000-4000-8000-000000000007','00000000-0000-4000-8000-000000000006','20 kg',20,20000,1500,true);insert into inventory(variant_id,quantity) values('00000000-0000-4000-8000-000000000007',3);insert into product_pet_types values('00000000-0000-4000-8000-000000000006',${pet});update products set published=true;`)
 expect((await db.query(`select distinct stock_group_key from products`)).rows).toHaveLength(1)
 await db.exec(`select set_loose_inventory('00000000-0000-4000-8000-000000000006',1,1500)`)
 const request=(items:unknown)=>db.query(`select create_public_order(gen_random_uuid(),'{"name":"Prueba aislada","phone":"0000000000"}','{"type":"retiro"}','local',$1::jsonb) as result`,[JSON.stringify(items)])
 for(const item of [
   {mode:'package',quantity:0.5},
   {mode:'kg',quantity:0.0001},
   {mode:'unknown',quantity:1},
   {mode:'kg',quantity:-1},
 ]) await expect(request([{variantId:'00000000-0000-4000-8000-000000000003',...item}])).rejects.toThrow()
 await expect(request([
   {variantId:'00000000-0000-4000-8000-000000000003',mode:'kg',quantity:0.6},
   {variantId:'00000000-0000-4000-8000-000000000007',mode:'kg',quantity:0.6},
 ])).rejects.toThrow()
 expect((await db.query<{qty:string}>(`select quantity_kg::text qty from loose_inventory`)).rows[0].qty).toBe('1.000')
 // An Excel-style closed-stock update must not change the owner's loose kg.
 await db.exec(`update inventory set quantity=4 where variant_id='00000000-0000-4000-8000-000000000007'`)
 expect((await db.query<{qty:string}>(`select quantity_kg::text qty from loose_inventory`)).rows[0].qty).toBe('1.000')
 await db.exec(`select set_config('request.jwt.claim.sub','',false)`)
 await expect(db.exec(opening)).rejects.toThrow('Staff permission required')
 await expect(db.exec(`select set_loose_inventory('00000000-0000-4000-8000-000000000006',100,1)`)).rejects.toThrow('Staff permission required')
 } finally {await db.close()}
},30000)
