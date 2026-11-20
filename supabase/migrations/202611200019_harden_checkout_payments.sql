-- V1 release hardening: checkout retries must be immutable and every public
-- response must contain the exact items/prices persisted by the database.

create or replace function public.build_public_order_response(p_order_id uuid)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'id', orders.id,
    'orderNumber', format(
      'OTTO-%s-%s',
      extract(year from orders.created_at)::integer,
      lpad(orders.order_number::text, 6, '0')
    ),
    'status', orders.status,
    'paymentMethod', orders.payment_method,
    'paymentStatus', orders.payment_status,
    'subtotal', orders.subtotal,
    'shipping', orders.shipping_amount,
    'total', orders.total,
    'items', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'productName', order_items.product_name,
            'presentation', order_items.presentation,
            'unitPrice', order_items.unit_price,
            'quantity', order_items.quantity,
            'subtotal', order_items.subtotal
          )
          order by order_items.id
        )
        from public.order_items
        where order_items.order_id = orders.id
      ),
      '[]'::jsonb
    )
  )
  from public.orders
  where orders.id = p_order_id;
$$;

revoke all on function public.build_public_order_response(uuid)
  from public, anon, authenticated;

-- The legacy creator originally did not understand "local". The wrapper sets
-- the requested method transaction-locally so the trigger validates and stores
-- the real method during the insert (not in a second, unsafe update).
create or replace function public.apply_store_settings_to_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  settings public.store_settings%rowtype;
  requested_payment_method text;
  normalized_cbu text;
  usable_cbu boolean;
begin
  requested_payment_method := nullif(
    current_setting('otto.requested_payment_method', true),
    ''
  );

  if tg_op = 'INSERT'
    and requested_payment_method in ('local', 'transferencia', 'entrega') then
    new.payment_method := requested_payment_method;
  end if;

  select *
  into settings
  from public.store_settings
  where id = true;

  if not found then
    raise exception 'La tienda todavía no tiene una configuración válida.';
  end if;

  if new.fulfillment_method = 'envio' and not settings.delivery_enabled then
    raise exception 'El envío a domicilio no está disponible en este momento.';
  end if;

  if new.fulfillment_method = 'retiro' and not settings.pickup_enabled then
    raise exception 'El retiro en el local no está disponible en este momento.';
  end if;

  if not settings.payment_methods ? new.payment_method then
    raise exception 'La forma de pago seleccionada no está disponible.';
  end if;

  if new.payment_method = 'local' and new.fulfillment_method <> 'retiro' then
    raise exception 'El pago en el local requiere retirar el pedido.';
  end if;

  if new.payment_method = 'entrega' and new.fulfillment_method <> 'envio' then
    raise exception 'El pago al recibir requiere envío a domicilio.';
  end if;

  if new.payment_method = 'transferencia' then
    normalized_cbu := regexp_replace(coalesce(settings.transfer_cbu, ''), '\D', '', 'g');
    usable_cbu := normalized_cbu ~ '^\d{22}$'
      and normalized_cbu !~ '^(\d)\1{21}$';
    if trim(coalesce(settings.transfer_holder, '')) = ''
      or (
        trim(coalesce(settings.transfer_alias, '')) = ''
        and not usable_cbu
      ) then
      raise exception 'La transferencia no está configurada. Elegí otra forma de pago.';
    end if;
    if normalized_cbu <> '' and not usable_cbu then
      raise exception 'El CBU/CVU configurado no es válido. Elegí otra forma de pago.';
    end if;
  end if;

  new.shipping_amount := case
    when new.fulfillment_method = 'retiro' then 0
    when settings.free_shipping_threshold is not null
      and new.subtotal >= settings.free_shipping_threshold then 0
    else settings.shipping_cost
  end;
  new.total := greatest(0, new.subtotal - new.discount + new.shipping_amount);

  return new;
end;
$$;

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
  existing_order_id uuid;
  created_result jsonb;
  fulfillment text := trim(coalesce(p_delivery->>'type', ''));
  legacy_payment_method text;
begin
  if p_payment_method not in ('local', 'transferencia', 'entrega') then
    raise exception 'Elegí una forma de pago válida.';
  end if;

  if p_payment_method = 'local' and fulfillment <> 'retiro' then
    raise exception 'El pago en el local requiere retirar el pedido.';
  end if;

  if p_payment_method = 'entrega' and fulfillment <> 'envio' then
    raise exception 'El pago al recibir requiere envío a domicilio.';
  end if;

  -- Serialize equal checkout keys. A retry can only read the original order;
  -- it can never change its payment method or reset a paid payment.
  perform pg_advisory_xact_lock(hashtextextended(p_checkout_key::text, 0));

  select id
  into existing_order_id
  from public.orders
  where checkout_key = p_checkout_key;

  if found then
    return public.build_public_order_response(existing_order_id);
  end if;

  perform set_config('otto.requested_payment_method', p_payment_method, true);
  legacy_payment_method := case
    when p_payment_method = 'local' then 'transferencia'
    else p_payment_method
  end;

  created_result := public.create_public_order_legacy(
    p_checkout_key,
    p_customer,
    p_delivery,
    legacy_payment_method,
    p_items
  );

  existing_order_id := (created_result->>'id')::uuid;
  return public.build_public_order_response(existing_order_id);
end;
$$;

revoke all on function public.create_public_order(
  uuid,
  jsonb,
  jsonb,
  text,
  jsonb
) from public;
grant execute on function public.create_public_order(
  uuid,
  jsonb,
  jsonb,
  text,
  jsonb
) to anon, authenticated;

-- A cancelled order may keep "paid" to signal that money was actually
-- received and needs manual attention. It cannot be newly marked as paid after
-- cancellation, which prevents accidental false positives in the back office.
create or replace function public.update_order_payment_status(
  p_order_id uuid,
  p_payment_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_order_status public.order_status;
  current_payment_status text;
begin
  if not public.is_staff() then
    raise exception 'Staff permission required';
  end if;

  if p_payment_status not in ('pending', 'paid', 'cancelled') then
    raise exception 'Estado de pago inválido.';
  end if;

  select status, payment_status
  into current_order_status, current_payment_status
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Pedido no encontrado.';
  end if;

  if current_order_status = 'cancelled'
    and p_payment_status = 'paid'
    and current_payment_status <> 'paid' then
    raise exception 'Reactivá el pedido antes de marcarlo como pagado.';
  end if;

  update public.orders
  set
    payment_status = p_payment_status,
    updated_at = now()
  where id = p_order_id;
end;
$$;

revoke all on function public.update_order_payment_status(uuid, text)
  from public, anon;
grant execute on function public.update_order_payment_status(uuid, text)
  to authenticated;
