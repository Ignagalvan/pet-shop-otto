create or replace function public.get_admin_dashboard_stats()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with boundaries as (
    select
      (date_trunc('day', now() at time zone 'America/Argentina/Cordoba')
        at time zone 'America/Argentina/Cordoba') as today_start,
      (date_trunc('week', now() at time zone 'America/Argentina/Cordoba')
        at time zone 'America/Argentina/Cordoba') as week_start,
      (date_trunc('month', now() at time zone 'America/Argentina/Cordoba')
        at time zone 'America/Argentina/Cordoba') as month_start
  ),
  order_metrics as (
    select
      coalesce(sum(orders.total) filter (
        where orders.created_at >= boundaries.today_start
          and orders.status <> 'cancelled'
      ), 0) as today_sales,
      coalesce(sum(orders.total) filter (
        where orders.created_at >= boundaries.week_start
          and orders.status <> 'cancelled'
      ), 0) as week_sales,
      coalesce(sum(orders.total) filter (
        where orders.created_at >= boundaries.month_start
          and orders.status <> 'cancelled'
      ), 0) as month_sales,
      count(*) filter (
        where orders.created_at >= boundaries.today_start
      ) as today_orders,
      count(*) filter (
        where orders.status in ('pending', 'confirmed', 'preparing', 'ready')
      ) as active_orders,
      coalesce(avg(orders.total) filter (
        where orders.created_at >= boundaries.month_start
          and orders.status <> 'cancelled'
      ), 0) as average_ticket
    from public.orders orders
    cross join boundaries
  ),
  sales_days as (
    select generate_series(
      ((now() at time zone 'America/Argentina/Cordoba')::date - interval '6 days')::date,
      (now() at time zone 'America/Argentina/Cordoba')::date,
      interval '1 day'
    )::date as day
  ),
  sales_by_day as (
    select
      days.day,
      coalesce(sum(orders.total) filter (
        where orders.status <> 'cancelled'
      ), 0) as total,
      count(orders.id) filter (
        where orders.status <> 'cancelled'
      ) as orders
    from sales_days days
    left join public.orders orders
      on (orders.created_at at time zone 'America/Argentina/Cordoba')::date = days.day
    group by days.day
    order by days.day
  ),
  top_products as (
    select
      items.product_name,
      sum(items.quantity) as quantity,
      sum(items.subtotal) as revenue
    from public.order_items items
    join public.orders orders on orders.id = items.order_id
    where orders.created_at >= now() - interval '30 days'
      and orders.status <> 'cancelled'
    group by items.product_name
    order by quantity desc, revenue desc
    limit 5
  ),
  recent_orders as (
    select
      orders.id,
      orders.order_number,
      orders.status,
      orders.total,
      orders.created_at,
      coalesce(nullif(orders.customer_snapshot->>'name', ''), 'Sin nombre') as customer_name
    from public.orders orders
    order by orders.created_at desc
    limit 5
  ),
  delivery_metrics as (
    select
      count(*) filter (where fulfillment_method = 'envio') as delivery,
      count(*) filter (where fulfillment_method = 'retiro') as pickup
    from public.orders
    where created_at >= now() - interval '30 days'
      and status <> 'cancelled'
  ),
  customer_metrics as (
    select
      count(distinct public.normalize_customer_phone(phone)) filter (
        where created_at >= (select month_start from boundaries)
      ) as new_customers
    from public.customers
  ),
  repeat_customers as (
    select count(*) as repeat_count
    from (
      select public.normalize_customer_phone(customer.phone)
      from public.customers customer
      join public.orders orders on orders.customer_id = customer.id
      where orders.status <> 'cancelled'
      group by public.normalize_customer_phone(customer.phone)
      having count(orders.id) >= 2
    ) repeated
  )
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
          select coalesce(sum(inventory.quantity * costs.purchase_cost), 0)
          from public.inventory inventory
          join public.variant_costs costs on costs.variant_id = inventory.variant_id
        ),
        'todaySales', (select today_sales from order_metrics),
        'weekSales', (select week_sales from order_metrics),
        'monthSales', (select month_sales from order_metrics),
        'todayOrders', (select today_orders from order_metrics),
        'activeOrders', (select active_orders from order_metrics),
        'averageTicket', (select average_ticket from order_metrics),
        'newCustomersMonth', (select new_customers from customer_metrics),
        'repeatCustomers', (select repeat_count from repeat_customers),
        'salesByDay', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'date', day,
              'total', total,
              'orders', orders
            )
            order by day
          )
          from sales_by_day
        ), '[]'::jsonb),
        'topProducts', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'name', product_name,
              'quantity', quantity,
              'revenue', revenue
            )
          )
          from top_products
        ), '[]'::jsonb),
        'recentOrders', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'id', id,
              'orderNumber', order_number,
              'status', status,
              'total', total,
              'createdAt', created_at,
              'customerName', customer_name
            )
          )
          from recent_orders
        ), '[]'::jsonb),
        'fulfillment', jsonb_build_object(
          'delivery', (select delivery from delivery_metrics),
          'pickup', (select pickup from delivery_metrics)
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
  end
  from order_metrics;
$$;

revoke all on function public.get_admin_dashboard_stats()
  from public, anon;
grant execute on function public.get_admin_dashboard_stats()
  to authenticated;
