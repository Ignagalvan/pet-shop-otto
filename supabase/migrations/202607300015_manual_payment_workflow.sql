alter function public.create_public_order(uuid, jsonb, jsonb, text, jsonb)
  rename to create_public_order_legacy;

revoke all on function public.create_public_order_legacy(
  uuid,
  jsonb,
  jsonb,
  text,
  jsonb
) from public, anon, authenticated;

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
  result jsonb;
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

  legacy_payment_method := case
    when p_payment_method = 'local' then 'transferencia'
    else p_payment_method
  end;

  result := public.create_public_order_legacy(
    p_checkout_key,
    p_customer,
    p_delivery,
    legacy_payment_method,
    p_items
  );

  update public.orders
  set
    payment_method = p_payment_method,
    payment_status = 'pending',
    updated_at = now()
  where id = (result->>'id')::uuid
    and payment_method is distinct from p_payment_method;

  return result || jsonb_build_object(
    'paymentMethod', p_payment_method,
    'paymentStatus', 'pending'
  );
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

update public.orders
set payment_method = case
  when payment_method = 'link' then 'transferencia'
  when payment_method = 'whatsapp' and fulfillment_method = 'retiro' then 'local'
  when payment_method = 'whatsapp' then 'entrega'
  else payment_method
end
where payment_method in ('link', 'whatsapp');

update public.orders
set payment_status = 'pending'
where payment_status not in ('pending', 'paid', 'cancelled')
  or payment_status is null;

alter table public.orders
  drop constraint if exists orders_payment_status_check;
alter table public.orders
  add constraint orders_payment_status_check
  check (payment_status in ('pending', 'paid', 'cancelled'));

update public.store_settings
set
  payment_methods = '["local", "transferencia", "entrega"]'::jsonb,
  updated_at = now()
where id = true;

alter table public.store_settings
  alter column payment_methods
  set default '["local", "transferencia", "entrega"]'::jsonb;

create or replace function public.apply_store_settings_to_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  settings public.store_settings%rowtype;
begin
  select *
  into settings
  from public.store_settings
  where id = true;

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

drop trigger if exists apply_store_settings_to_order_trigger
on public.orders;

create trigger apply_store_settings_to_order_trigger
before insert or update of payment_method, fulfillment_method, subtotal
on public.orders
for each row execute function public.apply_store_settings_to_order();

create or replace function public.update_order_payment_status(
  p_order_id uuid,
  p_payment_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'Staff permission required';
  end if;

  if p_payment_status not in ('pending', 'paid', 'cancelled') then
    raise exception 'Estado de pago inválido.';
  end if;

  update public.orders
  set
    payment_status = p_payment_status,
    updated_at = now()
  where id = p_order_id;

  if not found then
    raise exception 'Pedido no encontrado.';
  end if;
end;
$$;

revoke all on function public.update_order_payment_status(uuid, text)
  from public, anon;
grant execute on function public.update_order_payment_status(uuid, text)
  to authenticated;

create or replace function public.log_order_payment_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_number text;
  payment_label text;
begin
  if old.payment_status is not distinct from new.payment_status then
    return new;
  end if;

  display_number := format(
    'OTTO-%s-%s',
    extract(year from new.created_at)::integer,
    lpad(new.order_number::text, 6, '0')
  );
  payment_label := case new.payment_status
    when 'paid' then 'Pagado'
    when 'cancelled' then 'Pago cancelado'
    else 'Pago pendiente'
  end;

  insert into public.activity_logs (
    category,
    event_type,
    entity_type,
    entity_id,
    title,
    description,
    metadata,
    actor_id
  )
  values (
    'orders',
    'order_payment_status_changed',
    'order',
    new.id::text,
    'Pago actualizado: ' || display_number,
    'El estado del pago cambió a ' || payment_label || '.',
    jsonb_build_object(
      'orderNumber', display_number,
      'paymentMethod', new.payment_method,
      'previousPaymentStatus', old.payment_status,
      'paymentStatus', new.payment_status
    ),
    (select auth.uid())
  );

  return new;
end;
$$;

create trigger orders_payment_activity_trigger
after update of payment_status on public.orders
for each row execute function public.log_order_payment_activity();
