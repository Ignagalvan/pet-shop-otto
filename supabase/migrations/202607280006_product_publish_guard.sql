create or replace function public.validate_product_for_publication()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not new.published then
    return new;
  end if;

  if new.image_path is null or trim(new.image_path) = '' then
    raise exception 'Agregá una imagen antes de publicar el producto';
  end if;

  if new.description is null or length(trim(new.description)) < 10 then
    raise exception 'La descripción debe tener al menos 10 caracteres';
  end if;

  if new.brand_id is null or new.category_id is null then
    raise exception 'Completá la marca y la categoría antes de publicar';
  end if;

  if not exists (
    select 1
    from public.product_variants
    where product_id = new.id
      and active
      and package_price is not null
      and package_price > 0
  ) then
    raise exception 'El producto necesita un precio de venta válido';
  end if;

  if not exists (
    select 1
    from public.product_pet_types
    where product_id = new.id
  ) then
    raise exception 'Elegí al menos una mascota antes de publicar';
  end if;

  return new;
end;
$$;

drop trigger if exists product_publish_completeness_trigger
on public.products;

create constraint trigger product_publish_completeness_trigger
after insert or update of published on public.products
deferrable initially deferred
for each row execute function public.validate_product_for_publication();
