create or replace function public.get_admin_dashboard_stats()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case
    when not public.is_staff() then
      jsonb_build_object('authorized', false)
    else
      jsonb_build_object(
        'authorized', true,
        'products', (select count(*) from public.products),
        'published', (select count(*) from public.products where published and active),
        'outOfStock', (
          select count(*)
          from public.product_variants
          where active and stock_status = 'out_of_stock'
        ),
        'lowStock', (
          select count(*)
          from public.product_variants
          where active and stock_status = 'low'
        ),
        'inventoryUnits', (
          select coalesce(sum(quantity), 0)
          from public.inventory
        ),
        'inventoryValue', (
          select coalesce(sum(i.quantity * vc.purchase_cost), 0)
          from public.inventory i
          join public.variant_costs vc on vc.variant_id = i.variant_id
        ),
        'lastImport', (
          select jsonb_build_object(
            'fileName', file_name,
            'totalRows', total_rows,
            'newRows', new_rows,
            'updatedRows', updated_rows,
            'reviewRows', review_rows,
            'appliedAt', applied_at
          )
          from public.import_batches
          where status = 'applied'
          order by applied_at desc
          limit 1
        )
      )
  end;
$$;

revoke all on function public.get_admin_dashboard_stats() from public;
revoke all on function public.get_admin_dashboard_stats() from anon;
grant execute on function public.get_admin_dashboard_stats() to authenticated;

create or replace function public.update_admin_product(
  p_product_id uuid,
  p_variant_id uuid,
  p_data jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  old_quantity numeric(12,3);
  new_quantity numeric(12,3);
  pet_type_id_value bigint;
begin
  if not public.is_staff() then
    raise exception 'Staff permission required';
  end if;

  if not exists (
    select 1
    from public.product_variants
    where id = p_variant_id and product_id = p_product_id
  ) then
    raise exception 'Product variant not found';
  end if;

  new_quantity := greatest(coalesce((p_data->>'stockQuantity')::numeric, 0), 0);

  update public.products
  set
    name = trim(p_data->>'name'),
    description = nullif(trim(p_data->>'description'), ''),
    brand_id = nullif(p_data->>'brandId', '')::bigint,
    category_id = nullif(p_data->>'categoryId', '')::bigint,
    published = coalesce((p_data->>'published')::boolean, false),
    featured = coalesce((p_data->>'featured')::boolean, false),
    on_request = coalesce((p_data->>'onRequest')::boolean, false),
    active = true,
    updated_at = now()
  where id = p_product_id;

  if not found then
    raise exception 'Product not found';
  end if;

  update public.product_variants
  set
    presentation = nullif(trim(p_data->>'presentation'), ''),
    package_weight_kg = nullif(p_data->>'packageWeightKg', '')::numeric,
    package_price = nullif(p_data->>'packagePrice', '')::numeric,
    kg_price = nullif(p_data->>'kgPrice', '')::numeric,
    sells_by_package = true,
    sells_by_kg = coalesce((p_data->>'sellsByKg')::boolean, false),
    active = true,
    updated_at = now()
  where id = p_variant_id;

  insert into public.variant_costs (
    variant_id,
    purchase_cost,
    package_margin_percent,
    kg_margin_percent
  )
  values (
    p_variant_id,
    greatest(coalesce((p_data->>'purchaseCost')::numeric, 0), 0),
    nullif(p_data->>'packageMarginPercent', '')::numeric,
    nullif(p_data->>'kgMarginPercent', '')::numeric
  )
  on conflict (variant_id) do update set
    purchase_cost = excluded.purchase_cost,
    package_margin_percent = excluded.package_margin_percent,
    kg_margin_percent = excluded.kg_margin_percent,
    updated_at = now();

  select quantity into old_quantity
  from public.inventory
  where variant_id = p_variant_id;

  old_quantity := coalesce(old_quantity, 0);

  insert into public.inventory (variant_id, quantity)
  values (p_variant_id, new_quantity)
  on conflict (variant_id) do update set
    quantity = excluded.quantity,
    updated_at = now();

  if old_quantity <> new_quantity then
    insert into public.stock_movements (
      variant_id,
      quantity_change,
      reason,
      reference_type,
      reference_id,
      created_by
    )
    values (
      p_variant_id,
      new_quantity - old_quantity,
      'Edición manual desde el panel',
      'product',
      p_product_id::text,
      (select auth.uid())
    );
  end if;

  insert into public.price_history (
    variant_id,
    purchase_cost,
    package_price,
    kg_price,
    package_margin_percent,
    kg_margin_percent,
    source
  )
  values (
    p_variant_id,
    nullif(p_data->>'purchaseCost', '')::numeric,
    nullif(p_data->>'packagePrice', '')::numeric,
    nullif(p_data->>'kgPrice', '')::numeric,
    nullif(p_data->>'packageMarginPercent', '')::numeric,
    nullif(p_data->>'kgMarginPercent', '')::numeric,
    'manual'
  );

  delete from public.product_pet_types
  where product_id = p_product_id;

  for pet_type_id_value in
    select value::bigint
    from jsonb_array_elements_text(
      coalesce(p_data->'petTypeIds', '[]'::jsonb)
    )
  loop
    insert into public.product_pet_types (product_id, pet_type_id)
    values (p_product_id, pet_type_id_value)
    on conflict do nothing;
  end loop;
end;
$$;

revoke all on function public.update_admin_product(uuid, uuid, jsonb) from public;
revoke all on function public.update_admin_product(uuid, uuid, jsonb) from anon;
grant execute on function public.update_admin_product(uuid, uuid, jsonb) to authenticated;
