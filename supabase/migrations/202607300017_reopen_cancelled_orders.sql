create or replace function public.update_order_status(
  p_order_id uuid,
  p_status public.order_status
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  previous_status public.order_status;
  order_item record;
  available_quantity numeric(12,3);
begin
  if not public.is_staff() then
    raise exception 'Staff permission required';
  end if;

  select status
  into previous_status
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Pedido no encontrado.';
  end if;

  if previous_status = 'cancelled' and p_status <> 'cancelled' then
    for order_item in
      select
        variant_id,
        stock_quantity_delta,
        product_name
      from public.order_items
      where order_id = p_order_id
        and variant_id is not null
        and stock_quantity_delta > 0
      order by variant_id
    loop
      select quantity
      into available_quantity
      from public.inventory
      where variant_id = order_item.variant_id
      for update;

      if not found then
        raise exception
          'No se puede reactivar: no encontramos el inventario de %.',
          order_item.product_name;
      end if;

      if available_quantity < order_item.stock_quantity_delta then
        raise exception
          'No hay stock suficiente para reactivar %. Disponible: %, necesario: %.',
          order_item.product_name,
          available_quantity,
          order_item.stock_quantity_delta;
      end if;

      update public.inventory
      set
        quantity = quantity - order_item.stock_quantity_delta,
        updated_at = now()
      where variant_id = order_item.variant_id;

      insert into public.stock_movements (
        variant_id,
        quantity_change,
        reason,
        reference_type,
        reference_id,
        created_by
      )
      values (
        order_item.variant_id,
        -order_item.stock_quantity_delta,
        'Pedido reactivado',
        'order',
        p_order_id::text,
        (select auth.uid())
      );
    end loop;
  elsif previous_status <> 'cancelled' and p_status = 'cancelled' then
    for order_item in
      select variant_id, stock_quantity_delta
      from public.order_items
      where order_id = p_order_id
        and variant_id is not null
        and stock_quantity_delta > 0
      order by variant_id
    loop
      update public.inventory
      set
        quantity = quantity + order_item.stock_quantity_delta,
        updated_at = now()
      where variant_id = order_item.variant_id;

      insert into public.stock_movements (
        variant_id,
        quantity_change,
        reason,
        reference_type,
        reference_id,
        created_by
      )
      values (
        order_item.variant_id,
        order_item.stock_quantity_delta,
        'Pedido cancelado',
        'order',
        p_order_id::text,
        (select auth.uid())
      );
    end loop;
  end if;

  update public.orders
  set
    status = p_status,
    updated_at = now()
  where id = p_order_id;
end;
$$;

revoke all on function public.update_order_status(uuid, public.order_status)
  from public, anon;
grant execute on function public.update_order_status(uuid, public.order_status)
  to authenticated;
