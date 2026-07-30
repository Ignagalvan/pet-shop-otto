alter table public.store_settings
  add column if not exists transfer_alias text not null default '',
  add column if not exists transfer_holder text not null default '',
  add column if not exists transfer_bank text not null default '',
  add column if not exists transfer_cbu text not null default '',
  add column if not exists transfer_instructions text not null
    default 'Después de transferir, enviá el comprobante por WhatsApp.';

create table if not exists public.special_orders (
  id uuid primary key default gen_random_uuid(),
  request_number bigint generated always as identity unique,
  status text not null default 'new' check (
    status in (
      'new',
      'quoted',
      'awaiting_deposit',
      'deposit_paid',
      'ordered',
      'received',
      'delivered',
      'cancelled'
    )
  ),
  customer_name text not null check (char_length(customer_name) between 2 and 160),
  customer_phone text not null check (char_length(customer_phone) between 6 and 40),
  product_name text not null check (char_length(product_name) between 2 and 240),
  pet_type text not null check (char_length(pet_type) between 2 and 80),
  quantity integer not null default 1 check (quantity between 1 and 999),
  details text not null default '' check (char_length(details) <= 2000),
  reference_url text,
  quoted_amount numeric(12, 2) check (quoted_amount is null or quoted_amount >= 0),
  deposit_amount numeric(12, 2) check (deposit_amount is null or deposit_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists special_orders_status_created_at_idx
  on public.special_orders(status, created_at desc);

alter table public.special_orders enable row level security;

drop policy if exists "Staff manage special orders" on public.special_orders;
create policy "Staff manage special orders"
on public.special_orders
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

create or replace function public.touch_special_order_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists special_orders_updated_at_trigger
on public.special_orders;
create trigger special_orders_updated_at_trigger
before update on public.special_orders
for each row execute function public.touch_special_order_updated_at();

create or replace function public.log_special_order_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  action_name text;
  title_text text;
  detail_text text;
begin
  if tg_op = 'INSERT' then
    action_name := 'created';
    title_text := 'Nueva solicitud a pedido';
    detail_text := new.customer_name || ' solicitó ' || new.product_name;
  elsif new.status is distinct from old.status then
    action_name := 'status_changed';
    title_text := 'Solicitud a pedido actualizada';
    detail_text := new.product_name || ': ' || old.status || ' → ' || new.status;
  else
    return new;
  end if;

  insert into public.activity_logs (
    category,
    event_type,
    entity_type,
    entity_id,
    title,
    description,
    metadata
  ) values (
    'orders',
    action_name,
    'special_order',
    new.id::text,
    title_text,
    detail_text,
    jsonb_build_object(
      'requestNumber', new.request_number,
      'status', new.status,
      'customerName', new.customer_name,
      'productName', new.product_name
    )
  );

  return new;
end;
$$;

drop trigger if exists special_orders_activity_trigger
on public.special_orders;
create trigger special_orders_activity_trigger
after insert or update of status on public.special_orders
for each row execute function public.log_special_order_activity();

alter table public.special_orders replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'special_orders'
  ) then
    alter publication supabase_realtime add table public.special_orders;
  end if;
end;
$$;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'special-order-files',
  'special-order-files',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
