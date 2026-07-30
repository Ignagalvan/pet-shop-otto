alter table public.store_settings
  add column if not exists email text,
  add column if not exists delivery_enabled boolean not null default true,
  add column if not exists pickup_enabled boolean not null default true,
  add column if not exists shipping_cost numeric(12,2) not null default 4500
    check (shipping_cost >= 0),
  add column if not exists free_shipping_threshold numeric(12,2)
    default 40000 check (
      free_shipping_threshold is null or free_shipping_threshold > 0
    ),
  add column if not exists payment_methods jsonb not null
    default '["link", "transferencia", "entrega", "whatsapp"]'::jsonb,
  add column if not exists closed_store_message text not null
    default 'Podés hacer tu pedido con normalidad y lo vamos a preparar apenas abramos.';

insert into public.store_settings (
  id,
  store_name,
  instagram,
  whatsapp_number,
  address,
  email,
  business_hours,
  delivery_enabled,
  pickup_enabled,
  shipping_cost,
  free_shipping_threshold,
  payment_methods,
  closed_store_message
)
values (
  true,
  'Pet Shop Otto',
  'pet_shop.otto',
  '5491100000000',
  'General Paz 62, Salsipuedes, Córdoba',
  '',
  '{
    "timeZone": "America/Argentina/Cordoba",
    "days": [
      {"day": 0, "enabled": false, "shifts": []},
      {"day": 1, "enabled": true, "shifts": [{"start": "08:30", "end": "13:00"}, {"start": "16:30", "end": "20:30"}]},
      {"day": 2, "enabled": true, "shifts": [{"start": "08:30", "end": "13:00"}, {"start": "16:30", "end": "20:30"}]},
      {"day": 3, "enabled": true, "shifts": [{"start": "08:30", "end": "13:00"}, {"start": "16:30", "end": "20:30"}]},
      {"day": 4, "enabled": true, "shifts": [{"start": "08:30", "end": "13:00"}, {"start": "16:30", "end": "20:30"}]},
      {"day": 5, "enabled": true, "shifts": [{"start": "08:30", "end": "13:00"}, {"start": "16:30", "end": "20:30"}]},
      {"day": 6, "enabled": true, "shifts": [{"start": "08:30", "end": "13:00"}, {"start": "16:30", "end": "20:30"}]}
    ]
  }'::jsonb,
  true,
  true,
  4500,
  40000,
  '["link", "transferencia", "entrega", "whatsapp"]'::jsonb,
  'Podés hacer tu pedido con normalidad y lo vamos a preparar apenas abramos.'
)
on conflict (id) do nothing;

update public.store_settings
set business_hours = '{
  "timeZone": "America/Argentina/Cordoba",
  "days": [
    {"day": 0, "enabled": false, "shifts": []},
    {"day": 1, "enabled": true, "shifts": [{"start": "08:30", "end": "13:00"}, {"start": "16:30", "end": "20:30"}]},
    {"day": 2, "enabled": true, "shifts": [{"start": "08:30", "end": "13:00"}, {"start": "16:30", "end": "20:30"}]},
    {"day": 3, "enabled": true, "shifts": [{"start": "08:30", "end": "13:00"}, {"start": "16:30", "end": "20:30"}]},
    {"day": 4, "enabled": true, "shifts": [{"start": "08:30", "end": "13:00"}, {"start": "16:30", "end": "20:30"}]},
    {"day": 5, "enabled": true, "shifts": [{"start": "08:30", "end": "13:00"}, {"start": "16:30", "end": "20:30"}]},
    {"day": 6, "enabled": true, "shifts": [{"start": "08:30", "end": "13:00"}, {"start": "16:30", "end": "20:30"}]}
  ]
}'::jsonb
where business_hours = '{}'::jsonb;

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
before insert on public.orders
for each row execute function public.apply_store_settings_to_order();

