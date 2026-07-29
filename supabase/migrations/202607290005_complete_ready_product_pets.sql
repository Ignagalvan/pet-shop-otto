do $$
declare
  dog_pet_type_id bigint;
  inserted_count integer;
  published_count integer;
begin
  select id
  into dog_pet_type_id
  from public.pet_types
  where slug = 'perros'
    and active
  limit 1;

  if dog_pet_type_id is null then
    raise exception 'The active perros pet type was not found.';
  end if;

  insert into public.product_pet_types (product_id, pet_type_id)
  select product.id, dog_pet_type_id
  from public.products as product
  where regexp_replace(upper(trim(product.name)), '\s+', ' ', 'g') in (
    'VITAL CAN BALANCED CORDERO 3 KG',
    'VITAL CAN BALANCED CORDERO 15 KG',
    'SIEGER ADULTO MORDIDA PEQUEÑA 3KG',
    'SIEGER ADULTO MORDIDA PEQUEÑA 12KG'
  )
  on conflict do nothing;

  get diagnostics inserted_count = row_count;

  if inserted_count <> 4 then
    raise exception
      'Expected to assign Perros to 4 products, but assigned %.',
      inserted_count;
  end if;

  update public.products as product
  set
    published = true,
    updated_at = now()
  where regexp_replace(upper(trim(product.name)), '\s+', ' ', 'g') in (
    'VITAL CAN BALANCED CORDERO 3 KG',
    'VITAL CAN BALANCED CORDERO 15 KG',
    'SIEGER ADULTO MORDIDA PEQUEÑA 3KG',
    'SIEGER ADULTO MORDIDA PEQUEÑA 12KG'
  );

  get diagnostics published_count = row_count;

  if published_count <> 4 then
    raise exception
      'Expected to publish 4 completed products, but published %.',
      published_count;
  end if;
end;
$$;
