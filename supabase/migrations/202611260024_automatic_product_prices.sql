-- No existing prices or stock are recalculated by this migration.
begin;
alter table public.variant_costs add column rounding_step integer not null default 100
  check (rounding_step in (1,10,50,100,500,1000));

do $patch$
declare src text; needle text;
begin
  select pg_get_functiondef('public.update_admin_product(uuid,uuid,jsonb)'::regprocedure) into src;
  needle := '  if old_quantity <> new_quantity then';
  if position(needle in src)=0 then raise exception 'Expected stock guard not found; pricing migration aborted'; end if;
  src := replace(src,needle,E'  update public.variant_costs set rounding_step=coalesce(nullif(p_data->>''roundingStep'','''')::integer,rounding_step) where variant_id=p_variant_id;\n  if coalesce((p_data->>''syncLoosePrice'')::boolean,false) and coalesce((p_data->>''sellsByKg'')::boolean,false) then\n    if coalesce(nullif(p_data->>''kgPrice'','''')::numeric,0)<=0 or (p_data->>''kgPrice'')::numeric>100000000 then raise exception ''Ingresá un precio de venta por kilo válido.''; end if;\n    update public.loose_inventory set price_per_kg=(p_data->>''kgPrice'')::numeric,updated_at=now() where stock_group_key=(select stock_group_key from public.products where id=p_product_id);\n  end if;\n  if old_quantity <> new_quantity then');
  execute src;
end; $patch$;
notify pgrst, 'reload schema';
commit;
