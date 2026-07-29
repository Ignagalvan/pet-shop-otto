create temporary table cleaned_order_customers (
  customer_id uuid primary key
) on commit drop;

insert into cleaned_order_customers (customer_id)
select distinct customer_id
from public.orders
where customer_id is not null;

with stock_to_restore as (
  select
    item.variant_id,
    sum(item.stock_quantity_delta) as quantity
  from public.order_items item
  join public.orders orders on orders.id = item.order_id
  where orders.status <> 'cancelled'
    and item.variant_id is not null
    and item.stock_quantity_delta > 0
  group by item.variant_id
)
update public.inventory inventory
set
  quantity = inventory.quantity + stock_to_restore.quantity,
  updated_at = now()
from stock_to_restore
where inventory.variant_id = stock_to_restore.variant_id;

delete from public.stock_movements
where reference_type = 'order';

delete from public.orders;

delete from public.customers customer
using cleaned_order_customers cleaned
where customer.id = cleaned.customer_id
  and customer.auth_user_id is null
  and not exists (
    select 1
    from public.orders orders
    where orders.customer_id = customer.id
  );

alter table public.orders
  alter column order_number restart with 1;

do $$
begin
  if exists (select 1 from public.orders)
    or exists (select 1 from public.order_items) then
    raise exception 'La limpieza de pedidos de prueba no quedó completa.';
  end if;
end;
$$;
