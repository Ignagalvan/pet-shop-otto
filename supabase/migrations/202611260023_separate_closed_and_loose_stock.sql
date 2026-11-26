-- Schema-only conversion: existing closed quantities and prices are preserved.
-- Open stock starts at zero; only the owner can enter the real starting balance.
begin;
create table public.loose_inventory (
  stock_group_key text primary key,
  quantity_kg numeric(12,3) not null default 0 check (quantity_kg >= 0),
  price_per_kg numeric(12,2) not null default 0 check (price_per_kg >= 0),
  updated_at timestamptz not null default now()
);
alter table public.products add column stock_group_key text references public.loose_inventory(stock_group_key);
create function public.assign_stock_group() returns trigger language plpgsql security definer set search_path=public as $$
declare desired_key text;
begin
  desired_key := md5(upper(trim(regexp_replace(regexp_replace(new.name, '[0-9]+([.,][0-9]+)?\s*(kgs?|grs?|g)\M', '', 'gi'), '\s+', ' ', 'g'))));
  if new.stock_group_key is null or (tg_op='UPDATE' and new.name is distinct from old.name and desired_key<>old.stock_group_key) then
    if tg_op='UPDATE' and new.stock_group_key is not null and exists(select 1 from public.loose_inventory where stock_group_key=old.stock_group_key and quantity_kg>0) then raise exception 'No cambies el alimento mientras tenga kilos abiertos. Corregí primero su saldo real.'; end if;
    new.stock_group_key := desired_key;
    insert into public.loose_inventory(stock_group_key) values(new.stock_group_key) on conflict do nothing;
  end if;
  return new;
end; $$;
create trigger assign_stock_group_trigger before insert or update on public.products for each row execute function public.assign_stock_group();
update public.products set stock_group_key=null where stock_group_key is null;
alter table public.products alter column stock_group_key set not null;
create index products_stock_group_idx on public.products(stock_group_key);
alter table public.loose_inventory enable row level security;
create policy "Published loose stock readable" on public.loose_inventory for select using (exists(select 1 from public.products p where p.stock_group_key=loose_inventory.stock_group_key and p.published and p.active));
create policy "Staff read loose stock" on public.loose_inventory for select to authenticated using(public.is_staff());
create table public.loose_stock_movements (
 id bigint generated always as identity primary key,
 stock_group_key text not null references public.loose_inventory(stock_group_key),
 quantity_change_kg numeric(12,3) not null,
 reason text not null,
 order_id uuid references public.orders(id),
 created_by uuid references public.profiles(id),
 created_at timestamptz not null default now()
);
alter table public.loose_stock_movements enable row level security;
create policy "Staff read loose movements" on public.loose_stock_movements for select to authenticated using(public.is_staff());
alter table public.order_items add column loose_stock_key text references public.loose_inventory(stock_group_key), add column loose_quantity_delta numeric(12,3) not null default 0 check(loose_quantity_delta>=0);

create function public.set_loose_inventory(p_product_id uuid,p_quantity_kg numeric,p_price_per_kg numeric) returns void language plpgsql security definer set search_path=public as $$
declare k text; old_qty numeric;
begin
 if not public.is_staff() then raise exception 'Staff permission required'; end if;
 if p_quantity_kg is null or p_quantity_kg<0 or p_quantity_kg>1000000 or p_quantity_kg<>round(p_quantity_kg,3) or p_price_per_kg is null or p_price_per_kg<0 or (p_quantity_kg>0 and p_price_per_kg<=0) then raise exception 'Ingresá kilos y precio válidos.'; end if;
 select stock_group_key into k from public.products where id=p_product_id;
 if k is null then raise exception 'Producto no encontrado.'; end if;
 select quantity_kg into old_qty from public.loose_inventory where stock_group_key=k for update;
 update public.loose_inventory set quantity_kg=p_quantity_kg,price_per_kg=p_price_per_kg,updated_at=now() where stock_group_key=k;
 insert into public.loose_stock_movements(stock_group_key,quantity_change_kg,reason,created_by) values(k,p_quantity_kg-old_qty,'Ajuste manual de kilos sueltos',auth.uid());
 insert into public.activity_logs(category,event_type,entity_type,entity_id,title,description,actor_id) values('stock','loose_adjustment','product',p_product_id::text,'Stock suelto actualizado',p_quantity_kg::text||' kg sueltos disponibles.',auth.uid());
end; $$;
create table public.inventory_operations(id uuid primary key,created_at timestamptz not null default now());
alter table public.inventory_operations enable row level security;
create function public.open_product_bags(p_variant_id uuid,p_bags integer,p_price_per_kg numeric,p_operation_id uuid default gen_random_uuid()) returns void language plpgsql security definer set search_path=public as $$
declare v record; q numeric;
begin
 if not public.is_staff() then raise exception 'Staff permission required'; end if;
 if p_operation_id is null then raise exception 'Identificador de apertura requerido.'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 if exists(select 1 from public.inventory_operations where id=p_operation_id) then return; end if;
 if p_bags is null or p_bags<1 or p_bags>1000 or p_price_per_kg is null or p_price_per_kg<=0 then raise exception 'Ingresá bolsas y precio por kilo válidos.'; end if;
 select pv.*,p.stock_group_key from public.product_variants pv join public.products p on p.id=pv.product_id where pv.id=p_variant_id and pv.active into v;
 if not found or coalesce(v.package_weight_kg,0)<=0 or not v.sells_by_kg then raise exception 'Esta presentación no está configurada para vender suelto.'; end if;
 select quantity into q from public.inventory where variant_id=p_variant_id for update;
 if q is null or q<p_bags then raise exception 'No hay suficientes bolsas cerradas para abrir.'; end if;
 perform 1 from public.loose_inventory where stock_group_key=v.stock_group_key for update;
 update public.inventory set quantity=quantity-p_bags,updated_at=now() where variant_id=p_variant_id;
 update public.loose_inventory set quantity_kg=quantity_kg+p_bags*v.package_weight_kg,price_per_kg=p_price_per_kg,updated_at=now() where stock_group_key=v.stock_group_key;
 insert into public.stock_movements(variant_id,quantity_change,reason,reference_type,reference_id,created_by) values(p_variant_id,-p_bags,'Bolsa abierta para suelto','bag_opening',v.product_id::text,auth.uid());
 insert into public.loose_stock_movements(stock_group_key,quantity_change_kg,reason,created_by) values(v.stock_group_key,p_bags*v.package_weight_kg,'Apertura de bolsas cerradas',auth.uid());
 insert into public.inventory_operations(id) values(p_operation_id);
end; $$;
revoke all on function public.set_loose_inventory(uuid,numeric,numeric), public.open_product_bags(uuid,integer,numeric,uuid) from public,anon;
grant execute on function public.set_loose_inventory(uuid,numeric,numeric), public.open_product_bags(uuid,integer,numeric,uuid) to authenticated;

-- Preserve all checkout/payment/idempotency checks in the existing creator.
-- Every replacement is asserted so an unexpected schema aborts atomically.
do $patch$
declare src text; before_text text; after_text text;
begin
 select pg_get_functiondef('public.create_public_order_legacy(uuid,jsonb,jsonb,text,jsonb)'::regprocedure) into src;
 before_text := '  stock_delta numeric(12,3);';
 if position(before_text in src)=0 then raise exception 'Missing stock declaration'; end if;
 src:=replace(src,before_text,E'  stock_delta numeric(12,3);\n  loose_key text;\n  stock_key text;');
 src:=replace(src,'      product.on_request','      product.stock_group_key, product.on_request');
 before_text:='      if not item_record.sells_by_kg or coalesce(item_record.kg_price, 0) <= 0 then';
 if position(before_text in src)=0 then raise exception 'Missing kg validation'; end if;
 src:=replace(src,before_text,E'      select price_per_kg into item_price from public.loose_inventory where stock_group_key=item_record.stock_group_key;\n      if not item_record.sells_by_kg or coalesce(item_price,0)<=0 then');
 src:=replace(src,E'      item_price := item_record.kg_price;\n      stock_delta := item_quantity / item_record.package_weight_kg;', E'      stock_delta := item_quantity;');
 src:=replace(src,'      item_price := item_record.package_price;',E'      if item_quantity<>trunc(item_quantity) then raise exception ''Las bolsas cerradas se venden por unidades enteras.''; end if;\n      item_price := item_record.package_price;');
 before_text:=E'      select quantity\n      into available_quantity\n      from public.inventory\n      where variant_id = item_record.id\n      for update;';
 after_text:=E'      if coalesce(item->>''mode'',''package'')=''kg'' then\n        select quantity_kg into available_quantity from public.loose_inventory where stock_group_key=item_record.stock_group_key for update;\n        stock_key := ''loose:''||item_record.stock_group_key;\n      else\n        select quantity into available_quantity from public.inventory where variant_id=item_record.id for update;\n        stock_key := item_record.id::text;\n      end if;';
 if position(before_text in src)=0 then raise exception 'Missing inventory validation'; end if;
 src:=replace(src,before_text,after_text);
 src:=replace(src,'planned_stock->>item_record.id::text','planned_stock->>stock_key');
 src:=replace(src,'array[item_record.id::text]','array[stock_key]');
 src:=replace(src,'''stockDelta'', stock_delta',E'''stockDelta'', stock_delta,\n        ''mode'',coalesce(item->>''mode'',''package''),\n        ''looseKey'',item_record.stock_group_key');
 src:=replace(src,'then ''1 kg''','then ''Suelto (kg)''');
 src:=replace(src,'else coalesce(item_record.presentation, ''Presentación'')','else ''Bolsa cerrada: ''||coalesce(item_record.presentation, ''Unidad'')');
 src:=replace(src,E'      stock_quantity_delta\n    )',E'      stock_quantity_delta,loose_stock_key,loose_quantity_delta\n    )');
 src:=replace(src,E'      (item->>''stockDelta'')::numeric\n    );',E'      case when item->>''mode''=''kg'' then 0 else (item->>''stockDelta'')::numeric end,\n      case when item->>''mode''=''kg'' then item->>''looseKey'' else null end,\n      case when item->>''mode''=''kg'' then (item->>''stockDelta'')::numeric else 0 end\n    );');
 before_text:='    if (item->>''stockDelta'')::numeric > 0 then';
 if position(before_text in src)=0 then raise exception 'Missing stock write'; end if;
 src:=replace(src,before_text,E'    if item->>''mode''=''kg'' and (item->>''stockDelta'')::numeric>0 then\n      update public.loose_inventory set quantity_kg=quantity_kg-(item->>''stockDelta'')::numeric,updated_at=now() where stock_group_key=item->>''looseKey'';\n      insert into public.loose_stock_movements(stock_group_key,quantity_change_kg,reason,order_id) values(item->>''looseKey'',-(item->>''stockDelta'')::numeric,''Venta online suelto'',created_order.id);\n    elsif (item->>''stockDelta'')::numeric > 0 then');
 -- Reject unsupported modes and sub-gram quantities instead of rounding silently.
 src:=replace(src,'    item_quantity := nullif(item->>''quantity'', '''')::numeric;',E'    if coalesce(item->>''mode'',''package'') not in (''kg'',''package'') then raise exception ''Modalidad inválida.''; end if;\n    if (item->>''quantity'')::numeric<>round((item->>''quantity'')::numeric,3) then raise exception ''Usá cantidades en gramos enteros.''; end if;\n    item_quantity := nullif(item->>''quantity'', '''')::numeric;');
 -- Acquire all stock locks in the same order for mixed carts and concurrent orders.
 src:=replace(src,'  for item in select value from jsonb_array_elements(p_items)',E'  perform 1 from public.inventory where variant_id in(select (x->>''variantId'')::uuid from jsonb_array_elements(p_items) x) order by variant_id for update;\n  perform 1 from public.loose_inventory where stock_group_key in(select p.stock_group_key from public.products p join public.product_variants v on v.product_id=p.id where v.id in(select (x->>''variantId'')::uuid from jsonb_array_elements(p_items) x)) order by stock_group_key for update;\n  for item in select value from jsonb_array_elements(p_items)');
 if position('loose_quantity_delta' in src)=0 or position('stock_delta := item_quantity /' in src)>0 then raise exception 'Incomplete checkout stock patch'; end if;
 execute src;
end; $patch$;

do $patch$
declare src text; needle text;
begin
 select pg_get_functiondef('public.update_order_status(uuid,public.order_status)'::regprocedure) into src;
 src:=replace(src,'  available_quantity numeric(12,3);',E'  available_quantity numeric(12,3);\n  loose_item record;');
 needle:=E'  update public.orders\n  set';
 if position(needle in src)=0 then raise exception 'Missing order status write'; end if;
 src:=replace(src,needle,E'  if (previous_status=''cancelled'') <> (p_status=''cancelled'') then\n    for loose_item in select loose_stock_key,sum(loose_quantity_delta) as qty from public.order_items where order_id=p_order_id and loose_quantity_delta>0 group by loose_stock_key order by loose_stock_key loop\n      select quantity_kg into available_quantity from public.loose_inventory where stock_group_key=loose_item.loose_stock_key for update;\n      if not found then raise exception ''Inventario suelto no encontrado.''; end if;\n      if previous_status=''cancelled'' and available_quantity<loose_item.qty then raise exception ''No hay kilos sueltos suficientes para reactivar el pedido.''; end if;\n      update public.loose_inventory set quantity_kg=quantity_kg+case when p_status=''cancelled'' then loose_item.qty else -loose_item.qty end,updated_at=now() where stock_group_key=loose_item.loose_stock_key;\n      insert into public.loose_stock_movements(stock_group_key,quantity_change_kg,reason,order_id,created_by) values(loose_item.loose_stock_key,case when p_status=''cancelled'' then loose_item.qty else -loose_item.qty end,''Cambio de estado de pedido'',p_order_id,auth.uid());\n    end loop;\n  end if;\n  update public.orders\n  set');
 execute src;
end; $patch$;

notify pgrst, 'reload schema';
commit;
