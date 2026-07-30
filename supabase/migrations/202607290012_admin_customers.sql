create or replace function public.normalize_customer_phone(p_value text)
returns text
language sql
immutable
parallel safe
set search_path = public
as $$
  select regexp_replace(coalesce(p_value, ''), '[^0-9]+', '', 'g');
$$;

revoke all on function public.normalize_customer_phone(text) from public;
grant execute on function public.normalize_customer_phone(text) to authenticated;

create table if not exists public.customer_notes (
  phone_key text primary key,
  notes text not null default '' check (char_length(notes) <= 2000),
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  check (phone_key ~ '^[0-9]{6,20}$')
);

alter table public.customer_notes enable row level security;

create policy "Staff manage customer notes"
on public.customer_notes
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

create or replace function public.get_admin_customers(
  p_search text default '',
  p_limit integer default 25,
  p_offset integer default 0
)
returns table (
  phone_key text,
  full_name text,
  phone text,
  email text,
  pet_names text[],
  orders_count bigint,
  active_orders bigint,
  total_spent numeric,
  last_order_at timestamptz,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'Staff permission required';
  end if;

  return query
  with customer_orders as (
    select
      public.normalize_customer_phone(customer.phone) as normalized_phone,
      customer.full_name,
      customer.phone,
      customer.email,
      customer.created_at as customer_created_at,
      orders.id as order_id,
      orders.status,
      orders.total,
      orders.created_at as order_created_at,
      orders.customer_snapshot
    from public.customers customer
    left join public.orders orders on orders.customer_id = customer.id
    where public.normalize_customer_phone(customer.phone) <> ''
  ),
  grouped as (
    select
      rows.normalized_phone as phone_key,
      (
        array_agg(
          coalesce(
            nullif(trim(rows.customer_snapshot->>'name'), ''),
            rows.full_name
          )
          order by coalesce(rows.order_created_at, rows.customer_created_at) desc
        )
      )[1] as full_name,
      (
        array_agg(
          coalesce(
            nullif(trim(rows.customer_snapshot->>'phone'), ''),
            rows.phone
          )
          order by coalesce(rows.order_created_at, rows.customer_created_at) desc
        )
      )[1] as phone,
      (
        array_agg(
          coalesce(
            nullif(trim(rows.customer_snapshot->>'email'), ''),
            rows.email
          )
          order by coalesce(rows.order_created_at, rows.customer_created_at) desc
        )
      )[1] as email,
      coalesce(
        array_agg(
          distinct nullif(trim(rows.customer_snapshot->>'pet'), '')
        ) filter (
          where nullif(trim(rows.customer_snapshot->>'pet'), '') is not null
        ),
        '{}'::text[]
      ) as pet_names,
      count(distinct rows.order_id) as orders_count,
      count(distinct rows.order_id) filter (
        where rows.status in ('pending', 'confirmed', 'preparing', 'ready')
      ) as active_orders,
      coalesce(
        sum(rows.total) filter (
          where rows.order_id is not null and rows.status <> 'cancelled'
        ),
        0
      ) as total_spent,
      max(rows.order_created_at) as last_order_at
    from customer_orders rows
    group by rows.normalized_phone
  ),
  filtered as (
    select grouped.*
    from grouped
    where trim(coalesce(p_search, '')) = ''
      or grouped.full_name ilike '%' || trim(p_search) || '%'
      or grouped.phone ilike '%' || trim(p_search) || '%'
      or coalesce(grouped.email, '') ilike '%' || trim(p_search) || '%'
      or array_to_string(grouped.pet_names, ' ') ilike '%' || trim(p_search) || '%'
  )
  select
    filtered.phone_key,
    filtered.full_name,
    filtered.phone,
    filtered.email,
    filtered.pet_names,
    filtered.orders_count,
    filtered.active_orders,
    filtered.total_spent,
    filtered.last_order_at,
    count(*) over() as total_count
  from filtered
  order by filtered.last_order_at desc nulls last, filtered.full_name
  limit least(greatest(coalesce(p_limit, 25), 1), 10000)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

revoke all on function public.get_admin_customers(text, integer, integer)
  from public, anon;
grant execute on function public.get_admin_customers(text, integer, integer)
  to authenticated;

create or replace function public.get_admin_customer_detail(p_phone_key text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  customer_summary jsonb;
  customer_orders jsonb;
  internal_notes text;
begin
  if not public.is_staff() then
    raise exception 'Staff permission required';
  end if;

  select to_jsonb(summary)
  into customer_summary
  from public.get_admin_customers('', 10000, 0) summary
  where summary.phone_key = p_phone_key;

  if customer_summary is null then
    return null;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', orders.id,
        'orderNumber', orders.order_number,
        'status', orders.status,
        'paymentMethod', orders.payment_method,
        'paymentStatus', orders.payment_status,
        'fulfillmentMethod', orders.fulfillment_method,
        'subtotal', orders.subtotal,
        'shippingAmount', orders.shipping_amount,
        'total', orders.total,
        'customerSnapshot', orders.customer_snapshot,
        'notes', orders.notes,
        'createdAt', orders.created_at,
        'items', coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'id', item.id,
                'productName', item.product_name,
                'presentation', item.presentation,
                'unitPrice', item.unit_price,
                'quantity', item.quantity,
                'subtotal', item.subtotal
              )
              order by item.id
            )
            from public.order_items item
            where item.order_id = orders.id
          ),
          '[]'::jsonb
        )
      )
      order by orders.created_at desc
    ),
    '[]'::jsonb
  )
  into customer_orders
  from public.orders orders
  join public.customers customer on customer.id = orders.customer_id
  where public.normalize_customer_phone(customer.phone) = p_phone_key;

  select notes.notes
  into internal_notes
  from public.customer_notes notes
  where notes.phone_key = p_phone_key;

  return jsonb_build_object(
    'customer', customer_summary,
    'orders', customer_orders,
    'notes', coalesce(internal_notes, '')
  );
end;
$$;

revoke all on function public.get_admin_customer_detail(text)
  from public, anon;
grant execute on function public.get_admin_customer_detail(text)
  to authenticated;
