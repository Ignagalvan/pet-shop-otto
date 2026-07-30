create or replace function public.apply_otto_import(
  p_file_name text,
  p_rows jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_row jsonb;
  batch_id uuid;
  brand_id_value bigint;
  category_id_value bigint;
  product_id_value uuid;
  variant_id_value uuid;
  pet_type_slug text;
  pet_type_id_value bigint;
  normalized_name_value text;
  product_name_value text;
  product_slug_value text;
  previous_quantity numeric(12,3);
  new_quantity numeric(12,3);
  action_value public.import_row_action;
  issue_messages text[];
  new_count integer := 0;
  updated_count integer := 0;
  review_count integer := 0;
  error_count integer := 0;
begin
  if not public.is_staff() then
    raise exception 'Staff permission required';
  end if;

  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0 then
    raise exception 'The import does not contain product rows';
  end if;

  insert into public.import_batches (
    file_name,
    status,
    total_rows,
    uploaded_by
  )
  values (
    p_file_name,
    'previewed',
    jsonb_array_length(p_rows),
    (select auth.uid())
  )
  returning id into batch_id;

  for current_row in select value from jsonb_array_elements(p_rows)
  loop
    normalized_name_value := nullif(current_row->>'normalizedName', '');
    product_name_value := nullif(current_row->>'rawName', '');

    if normalized_name_value is null or product_name_value is null then
      error_count := error_count + 1;
      continue;
    end if;

    issue_messages := array(
      select issue->>'message'
      from jsonb_array_elements(coalesce(current_row->'issues', '[]'::jsonb)) issue
    );

    if current_row->>'status' = 'error' then
      insert into public.import_rows (
        batch_id,
        row_number,
        raw_name,
        normalized_name,
        action,
        parsed_data,
        issues
      )
      values (
        batch_id,
        (current_row->>'rowNumber')::integer,
        product_name_value,
        normalized_name_value,
        'error',
        current_row,
        issue_messages
      );
      error_count := error_count + 1;
      continue;
    end if;

    insert into public.brands (name, slug)
    values (
      coalesce(nullif(current_row->>'brandCandidate', ''), 'Sin marca'),
      lower(regexp_replace(
        coalesce(nullif(current_row->>'brandCandidate', ''), 'sin-marca'),
        '[^a-zA-Z0-9]+',
        '-',
        'g'
      ))
    )
    on conflict (slug) do update set
      name = excluded.name,
      active = true
    returning id into brand_id_value;

    select id into category_id_value
    from public.categories
    where slug = coalesce(nullif(current_row->>'categoryCandidate', ''), 'otros');

    if category_id_value is null then
      select id into category_id_value
      from public.categories
      where slug = 'otros';
    end if;

    select pa.variant_id, pv.product_id
    into variant_id_value, product_id_value
    from public.product_aliases pa
    join public.product_variants pv on pv.id = pa.variant_id
    where pa.normalized_name = normalized_name_value;

    new_quantity := coalesce((current_row->>'stockQuantity')::numeric, 0);

    if variant_id_value is null then
      product_slug_value :=
        lower(regexp_replace(normalized_name_value, '[^a-zA-Z0-9]+', '-', 'g'))
        || '-'
        || substr(md5(normalized_name_value), 1, 8);

      insert into public.products (
        name,
        slug,
        brand_id,
        category_id,
        active,
        published
      )
      values (
        product_name_value,
        product_slug_value,
        brand_id_value,
        category_id_value,
        true,
        false
      )
      returning id into product_id_value;

      insert into public.product_variants (
        product_id,
        presentation,
        package_weight_kg,
        package_price,
        kg_price,
        sells_by_package,
        sells_by_kg,
        active
      )
      values (
        product_id_value,
        nullif(current_row->>'presentation', ''),
        nullif(current_row->>'packageWeightKg', '')::numeric,
        nullif(current_row->>'packagePrice', '')::numeric,
        nullif(current_row->>'kgPrice', '')::numeric,
        coalesce((current_row->>'sellsByPackage')::boolean, true),
        coalesce((current_row->>'sellsByKg')::boolean, false),
        true
      )
      returning id into variant_id_value;

      insert into public.product_aliases (
        variant_id,
        raw_name,
        normalized_name
      )
      values (
        variant_id_value,
        product_name_value,
        normalized_name_value
      );

      previous_quantity := 0;
      action_value := 'new';
      new_count := new_count + 1;
    else
      select quantity into previous_quantity
      from public.inventory
      where variant_id = variant_id_value;

      previous_quantity := coalesce(previous_quantity, 0);

      update public.products
      set
        name = product_name_value,
        brand_id = brand_id_value,
        category_id = category_id_value,
        active = true,
        updated_at = now()
      where id = product_id_value;

      update public.product_variants
      set
        presentation = nullif(current_row->>'presentation', ''),
        package_weight_kg = nullif(current_row->>'packageWeightKg', '')::numeric,
        package_price = nullif(current_row->>'packagePrice', '')::numeric,
        kg_price = nullif(current_row->>'kgPrice', '')::numeric,
        sells_by_package = coalesce((current_row->>'sellsByPackage')::boolean, true),
        sells_by_kg = coalesce((current_row->>'sellsByKg')::boolean, false),
        active = true,
        updated_at = now()
      where id = variant_id_value;

      update public.product_aliases
      set raw_name = product_name_value
      where normalized_name = normalized_name_value;

      action_value := 'update';
      updated_count := updated_count + 1;
    end if;

    insert into public.variant_costs (
      variant_id,
      purchase_cost,
      package_margin_percent,
      kg_margin_percent
    )
    values (
      variant_id_value,
      coalesce(nullif(current_row->>'purchasePrice', '')::numeric, 0),
      nullif(current_row->>'packageMarginPercent', '')::numeric,
      nullif(current_row->>'kgMarginPercent', '')::numeric
    )
    on conflict (variant_id) do update set
      purchase_cost = excluded.purchase_cost,
      package_margin_percent = excluded.package_margin_percent,
      kg_margin_percent = excluded.kg_margin_percent,
      updated_at = now();

    insert into public.inventory (variant_id, quantity)
    values (variant_id_value, new_quantity)
    on conflict (variant_id) do update set
      quantity = excluded.quantity,
      updated_at = now();

    if new_quantity <> previous_quantity then
      insert into public.stock_movements (
        variant_id,
        quantity_change,
        reason,
        reference_type,
        reference_id,
        created_by
      )
      values (
        variant_id_value,
        new_quantity - previous_quantity,
        'Importación mensual de Excel',
        'import_batch',
        batch_id::text,
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
      variant_id_value,
      nullif(current_row->>'purchasePrice', '')::numeric,
      nullif(current_row->>'packagePrice', '')::numeric,
      nullif(current_row->>'kgPrice', '')::numeric,
      nullif(current_row->>'packageMarginPercent', '')::numeric,
      nullif(current_row->>'kgMarginPercent', '')::numeric,
      'excel'
    );

    delete from public.product_pet_types
    where product_id = product_id_value;

    for pet_type_slug in
      select jsonb_array_elements_text(
        coalesce(current_row->'petTypeCandidates', '[]'::jsonb)
      )
    loop
      select id into pet_type_id_value
      from public.pet_types
      where slug = pet_type_slug;

      if pet_type_id_value is not null then
        insert into public.product_pet_types (product_id, pet_type_id)
        values (product_id_value, pet_type_id_value)
        on conflict do nothing;
      end if;
    end loop;

    insert into public.import_rows (
      batch_id,
      row_number,
      raw_name,
      normalized_name,
      action,
      matched_variant_id,
      parsed_data,
      issues
    )
    values (
      batch_id,
      (current_row->>'rowNumber')::integer,
      product_name_value,
      normalized_name_value,
      case
        when current_row->>'status' = 'review' then 'review'::public.import_row_action
        else action_value
      end,
      variant_id_value,
      current_row,
      issue_messages
    );

    if current_row->>'status' = 'review' then
      review_count := review_count + 1;
    end if;
  end loop;

  update public.import_batches
  set
    status = 'applied',
    new_rows = new_count,
    updated_rows = updated_count,
    review_rows = review_count,
    error_rows = error_count,
    applied_at = now()
  where id = batch_id;

  return jsonb_build_object(
    'batchId', batch_id,
    'total', jsonb_array_length(p_rows),
    'new', new_count,
    'updated', updated_count,
    'review', review_count,
    'errors', error_count
  );
end;
$$;

revoke all on function public.apply_otto_import(text, jsonb) from public;
revoke all on function public.apply_otto_import(text, jsonb) from anon;
grant execute on function public.apply_otto_import(text, jsonb) to authenticated;
