do $$
declare
  ready_count integer;
  published_ready_count integer;
begin
  select count(*)
  into ready_count
  from public.products as product
  where product.active
    and nullif(trim(product.image_path), '') is not null
    and product.description is not null
    and length(trim(product.description)) >= 10
    and product.brand_id is not null
    and product.category_id is not null
    and exists (
      select 1
      from public.product_variants as variant
      where variant.product_id = product.id
        and variant.active
        and variant.package_price is not null
        and variant.package_price > 0
    )
    and exists (
      select 1
      from public.product_pet_types as product_pet
      where product_pet.product_id = product.id
    );

  update public.products as product
  set
    published = true,
    updated_at = now()
  where product.active
    and nullif(trim(product.image_path), '') is not null
    and product.description is not null
    and length(trim(product.description)) >= 10
    and product.brand_id is not null
    and product.category_id is not null
    and exists (
      select 1
      from public.product_variants as variant
      where variant.product_id = product.id
        and variant.active
        and variant.package_price is not null
        and variant.package_price > 0
    )
    and exists (
      select 1
      from public.product_pet_types as product_pet
      where product_pet.product_id = product.id
    );

  select count(*)
  into published_ready_count
  from public.products as product
  where product.published
    and product.active
    and nullif(trim(product.image_path), '') is not null
    and product.description is not null
    and length(trim(product.description)) >= 10
    and product.brand_id is not null
    and product.category_id is not null
    and exists (
      select 1
      from public.product_variants as variant
      where variant.product_id = product.id
        and variant.active
        and variant.package_price is not null
        and variant.package_price > 0
    )
    and exists (
      select 1
      from public.product_pet_types as product_pet
      where product_pet.product_id = product.id
    );

  if published_ready_count <> ready_count then
    raise exception
      'Expected % ready products to be published, but found %.',
      ready_count,
      published_ready_count;
  end if;
end;
$$;
