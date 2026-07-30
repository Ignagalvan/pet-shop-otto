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
        'fullName', (
          select full_name
          from public.profiles
          where id = (select auth.uid())
        ),
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
