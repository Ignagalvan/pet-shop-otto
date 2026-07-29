alter table public.orders
  add column if not exists checkout_key uuid not null default gen_random_uuid(),
  add column if not exists shipping_amount numeric(12,2) not null default 0
    check (shipping_amount >= 0);

alter table public.order_items
  add column if not exists stock_quantity_delta numeric(12,3) not null default 0
    check (stock_quantity_delta >= 0);

create unique index if not exists orders_checkout_key_idx
  on public.orders(checkout_key);

create index if not exists orders_status_created_at_idx
  on public.orders(status, created_at desc);

create or replace function public.create_public_order(
  p_checkout_key uuid,
  p_customer jsonb,
  p_delivery jsonb,
  p_payment_method text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_order public.orders%rowtype;
  created_order public.orders%rowtype;
  created_customer_id uuid;
  item jsonb;
  item_key text;
  seen_item_keys text[] := '{}';
  item_record record;
  normalized_items jsonb := '[]'::jsonb;
  item_quantity numeric(12,3);
  item_price numeric(12,2);
  stock_delta numeric(12,3);
  available_quantity numeric(12,3);
  calculated_subtotal numeric(12,2) := 0;
  calculated_shipping numeric(12,2) := 0;
  fulfillment text;
  customer_name text;
  customer_phone text;
  customer_email text;
  pet_name text;
  display_number text;
begin
  select *
  into existing_order
  from public.orders
  where checkout_key = p_checkout_key;

  if found then
    return jsonb_build_object(
      'id', existing_order.id,
      'orderNumber', format(
        'OTTO-%s-%s',
        extract(year from existing_order.created_at)::integer,
        lpad(existing_order.order_number::text, 6, '0')
      ),
      'status', existing_order.status,
      'subtotal', existing_order.subtotal,
      'shipping', existing_order.shipping_amount,
      'total', existing_order.total
    );
  end if;

  customer_name := trim(coalesce(p_customer->>'name', ''));
  customer_phone := trim(coalesce(p_customer->>'phone', ''));
  customer_email := nullif(trim(coalesce(p_customer->>'email', '')), '');
  pet_name := nullif(trim(coalesce(p_customer->>'pet', '')), '');
  fulfillment := trim(coalesce(p_delivery->>'type', ''));

  if char_length(customer_name) < 2 or char_length(customer_name) > 120 then
    raise exception 'Ingresá un nombre válido.';
  end if;

  if char_length(customer_phone) < 6 or char_length(customer_phone) > 40 then
    raise exception 'Ingresá un WhatsApp válido.';
  end if;

  if customer_email is not null
    and customer_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'Ingresá un correo electrónico válido.';
  end if;

  if fulfillment not in ('envio', 'retiro') then
    raise exception 'Elegí una forma de entrega válida.';
  end if;

  if fulfillment = 'envio' then
    if char_length(trim(coalesce(p_delivery->>'address', ''))) < 4
      or char_length(trim(coalesce(p_delivery->>'city', ''))) < 2 then
      raise exception 'Completá la dirección y la localidad.';
    end if;
  end if;

  if p_payment_method not in ('link', 'transferencia', 'entrega', 'whatsapp') then
    raise exception 'Elegí una forma de pago válida.';
  end if;

  if jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) = 0
    or jsonb_array_length(p_items) > 50 then
    raise exception 'El pedido no contiene productos válidos.';
  end if;

  for item in select value from jsonb_array_elements(p_items)
  loop
    item_key := coalesce(item->>'variantId', '') || ':' || coalesce(item->>'mode', 'package');
    if item_key = ':package' or item_key = any(seen_item_keys) then
      raise exception 'El pedido contiene productos repetidos o inválidos.';
    end if;
    seen_item_keys := array_append(seen_item_keys, item_key);

    item_quantity := nullif(item->>'quantity', '')::numeric;

    if item_quantity is null or item_quantity <= 0 or item_quantity > 1000 then
      raise exception 'Una cantidad del pedido no es válida.';
    end if;

    select
      variant.id,
      variant.presentation,
      variant.package_weight_kg,
      variant.package_price,
      variant.kg_price,
      variant.sells_by_package,
      variant.sells_by_kg,
      variant.stock_status,
      product.name as product_name,
      product.on_request
    into item_record
    from public.product_variants variant
    join public.products product on product.id = variant.product_id
    where variant.id = (item->>'variantId')::uuid
      and variant.active
      and product.active
      and product.published;

    if not found then
      raise exception 'Uno de los productos ya no está disponible.';
    end if;

    if coalesce(item->>'mode', 'package') = 'kg' then
      if not item_record.sells_by_kg or coalesce(item_record.kg_price, 0) <= 0 then
        raise exception 'La venta por kilo seleccionada ya no está disponible.';
      end if;
      if coalesce(item_record.package_weight_kg, 0) <= 0 then
        raise exception 'No pudimos calcular el stock de un producto por kilo.';
      end if;
      item_price := item_record.kg_price;
      stock_delta := item_quantity / item_record.package_weight_kg;
    else
      if not item_record.sells_by_package or coalesce(item_record.package_price, 0) <= 0 then
        raise exception 'La presentación seleccionada ya no está disponible.';
      end if;
      item_price := item_record.package_price;
      stock_delta := item_quantity;
    end if;

    if not item_record.on_request and item_record.stock_status <> 'on_request' then
      select quantity
      into available_quantity
      from public.inventory
      where variant_id = item_record.id
      for update;

      if available_quantity is null or available_quantity + 0.000001 < stock_delta then
        raise exception 'No hay stock suficiente de %.', item_record.product_name;
      end if;
    else
      stock_delta := 0;
    end if;

    calculated_subtotal :=
      calculated_subtotal + round(item_price * item_quantity, 2);

    normalized_items := normalized_items || jsonb_build_array(
      jsonb_build_object(
        'variantId', item_record.id,
        'productName', item_record.product_name,
        'presentation', case
          when coalesce(item->>'mode', 'package') = 'kg' then '1 kg'
          else coalesce(item_record.presentation, 'Presentación')
        end,
        'unitPrice', item_price,
        'quantity', item_quantity,
        'stockDelta', stock_delta
      )
    );
  end loop;

  calculated_shipping := case
    when fulfillment = 'retiro' or calculated_subtotal >= 40000 then 0
    else 4500
  end;

  insert into public.customers (full_name, phone, email)
  values (customer_name, customer_phone, customer_email)
  returning id into created_customer_id;

  if pet_name is not null then
    insert into public.pets (customer_id, name)
    values (created_customer_id, pet_name);
  end if;

  insert into public.orders (
    checkout_key,
    customer_id,
    payment_method,
    fulfillment_method,
    subtotal,
    shipping_amount,
    total,
    customer_snapshot,
    notes
  )
  values (
    p_checkout_key,
    created_customer_id,
    p_payment_method,
    fulfillment,
    calculated_subtotal,
    calculated_shipping,
    calculated_subtotal + calculated_shipping,
    jsonb_build_object(
      'name', customer_name,
      'phone', customer_phone,
      'email', customer_email,
      'pet', pet_name,
      'delivery', p_delivery
    ),
    nullif(trim(coalesce(p_delivery->>'notes', '')), '')
  )
  returning * into created_order;

  for item in select value from jsonb_array_elements(normalized_items)
  loop
    insert into public.order_items (
      order_id,
      variant_id,
      product_name,
      presentation,
      unit_price,
      quantity,
      stock_quantity_delta
    )
    values (
      created_order.id,
      (item->>'variantId')::uuid,
      item->>'productName',
      item->>'presentation',
      (item->>'unitPrice')::numeric,
      (item->>'quantity')::numeric,
      (item->>'stockDelta')::numeric
    );

    if (item->>'stockDelta')::numeric > 0 then
      update public.inventory
      set
        quantity = quantity - (item->>'stockDelta')::numeric,
        updated_at = now()
      where variant_id = (item->>'variantId')::uuid;

      insert into public.stock_movements (
        variant_id,
        quantity_change,
        reason,
        reference_type,
        reference_id
      )
      values (
        (item->>'variantId')::uuid,
        -((item->>'stockDelta')::numeric),
        'Venta online',
        'order',
        created_order.id::text
      );
    end if;
  end loop;

  display_number := format(
    'OTTO-%s-%s',
    extract(year from created_order.created_at)::integer,
    lpad(created_order.order_number::text, 6, '0')
  );

  return jsonb_build_object(
    'id', created_order.id,
    'orderNumber', display_number,
    'status', created_order.status,
    'subtotal', created_order.subtotal,
    'shipping', created_order.shipping_amount,
    'total', created_order.total
  );
exception
  when unique_violation then
    select *
    into existing_order
    from public.orders
    where checkout_key = p_checkout_key;

    if found then
      return jsonb_build_object(
        'id', existing_order.id,
        'orderNumber', format(
          'OTTO-%s-%s',
          extract(year from existing_order.created_at)::integer,
          lpad(existing_order.order_number::text, 6, '0')
        ),
        'status', existing_order.status,
        'subtotal', existing_order.subtotal,
        'shipping', existing_order.shipping_amount,
        'total', existing_order.total
      );
    end if;
    raise;
end;
$$;

revoke all on function public.create_public_order(uuid, jsonb, jsonb, text, jsonb)
  from public;
grant execute on function public.create_public_order(uuid, jsonb, jsonb, text, jsonb)
  to anon, authenticated;

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
    raise exception 'Un pedido cancelado no se puede reabrir.';
  end if;

  if previous_status <> 'cancelled' and p_status = 'cancelled' then
    for order_item in
      select variant_id, stock_quantity_delta
      from public.order_items
      where order_id = p_order_id
        and variant_id is not null
        and stock_quantity_delta > 0
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
