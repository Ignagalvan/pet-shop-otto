create policy "Public inventory is readable"
on public.inventory
for select
using (
  exists (
    select 1
    from public.product_variants variant
    join public.products product on product.id = variant.product_id
    where variant.id = inventory.variant_id
      and variant.active
      and product.active
      and product.published
  )
);
