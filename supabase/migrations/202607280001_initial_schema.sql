create extension if not exists pgcrypto;

create type public.app_role as enum ('owner', 'admin', 'staff');
create type public.stock_status as enum ('available', 'low', 'out_of_stock', 'on_request');
create type public.import_status as enum ('uploaded', 'previewed', 'applied', 'failed', 'cancelled');
create type public.import_row_action as enum ('new', 'update', 'unchanged', 'review', 'error');
create type public.order_status as enum ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.app_role not null default 'staff',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.brands (
  id bigint generated always as identity primary key,
  name text not null,
  slug text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.categories (
  id bigint generated always as identity primary key,
  name text not null,
  slug text not null unique,
  active boolean not null default true,
  sort_order integer not null default 0
);

create table public.pet_types (
  id bigint generated always as identity primary key,
  name text not null,
  slug text not null unique,
  active boolean not null default true,
  sort_order integer not null default 0
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  brand_id bigint references public.brands(id),
  category_id bigint references public.categories(id),
  image_path text,
  active boolean not null default true,
  published boolean not null default false,
  featured boolean not null default false,
  on_request boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_pet_types (
  product_id uuid not null references public.products(id) on delete cascade,
  pet_type_id bigint not null references public.pet_types(id) on delete cascade,
  primary key (product_id, pet_type_id)
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text unique,
  presentation text,
  package_weight_kg numeric(10,3),
  package_price numeric(12,2) check (package_price is null or package_price >= 0),
  kg_price numeric(12,2) check (kg_price is null or kg_price >= 0),
  sells_by_package boolean not null default true,
  sells_by_kg boolean not null default false,
  stock_status public.stock_status not null default 'out_of_stock',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.variant_costs (
  variant_id uuid primary key references public.product_variants(id) on delete cascade,
  purchase_cost numeric(12,2) not null default 0 check (purchase_cost >= 0),
  package_margin_percent numeric(8,2),
  kg_margin_percent numeric(8,2),
  updated_at timestamptz not null default now()
);

create table public.inventory (
  variant_id uuid primary key references public.product_variants(id) on delete cascade,
  quantity numeric(12,3) not null default 0,
  low_stock_threshold numeric(12,3) not null default 3,
  updated_at timestamptz not null default now()
);

create table public.stock_movements (
  id bigint generated always as identity primary key,
  variant_id uuid not null references public.product_variants(id),
  quantity_change numeric(12,3) not null,
  reason text not null,
  reference_type text,
  reference_id text,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.price_history (
  id bigint generated always as identity primary key,
  variant_id uuid not null references public.product_variants(id),
  purchase_cost numeric(12,2),
  package_price numeric(12,2),
  kg_price numeric(12,2),
  package_margin_percent numeric(8,2),
  kg_margin_percent numeric(8,2),
  source text not null default 'manual',
  recorded_at timestamptz not null default now()
);

create table public.product_aliases (
  id bigint generated always as identity primary key,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  raw_name text not null,
  normalized_name text not null unique,
  created_at timestamptz not null default now()
);

create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_hash text,
  status public.import_status not null default 'uploaded',
  total_rows integer not null default 0,
  new_rows integer not null default 0,
  updated_rows integer not null default 0,
  unchanged_rows integer not null default 0,
  review_rows integer not null default 0,
  error_rows integer not null default 0,
  uploaded_by uuid references public.profiles(id),
  applied_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.import_rows (
  id bigint generated always as identity primary key,
  batch_id uuid not null references public.import_batches(id) on delete cascade,
  row_number integer not null,
  raw_name text,
  normalized_name text,
  action public.import_row_action not null,
  matched_variant_id uuid references public.product_variants(id),
  parsed_data jsonb not null default '{}'::jsonb,
  issues text[] not null default '{}',
  unique (batch_id, row_number)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  phone text not null,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pets (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  name text not null,
  pet_type_id bigint references public.pet_types(id),
  notes text,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  customer_id uuid references public.customers(id),
  status public.order_status not null default 'pending',
  payment_method text,
  payment_status text not null default 'pending',
  fulfillment_method text,
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  customer_snapshot jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  variant_id uuid references public.product_variants(id),
  product_name text not null,
  presentation text,
  unit_price numeric(12,2) not null,
  quantity numeric(12,3) not null,
  subtotal numeric(12,2) generated always as (unit_price * quantity) stored
);

create table public.store_settings (
  id boolean primary key default true check (id),
  store_name text not null default 'Pet Shop Otto',
  instagram text,
  whatsapp_number text,
  address text,
  business_hours jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index products_brand_id_idx on public.products(brand_id);
create index products_category_id_idx on public.products(category_id);
create index products_published_idx on public.products(published, active);
create index variants_product_id_idx on public.product_variants(product_id);
create index stock_movements_variant_id_idx on public.stock_movements(variant_id, created_at desc);
create index price_history_variant_id_idx on public.price_history(variant_id, recorded_at desc);
create index import_rows_batch_id_idx on public.import_rows(batch_id, action);
create index orders_customer_id_idx on public.orders(customer_id, created_at desc);

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role in ('owner', 'admin', 'staff')
  );
$$;

revoke all on function public.is_staff() from public;
grant execute on function public.is_staff() to authenticated;

create or replace function public.sync_variant_stock_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.product_variants
  set
    stock_status = case
      when new.quantity <= 0 then 'out_of_stock'::public.stock_status
      when new.quantity <= new.low_stock_threshold then 'low'::public.stock_status
      else 'available'::public.stock_status
    end,
    updated_at = now()
  where id = new.variant_id
    and stock_status <> 'on_request';
  return new;
end;
$$;

create trigger inventory_stock_status_trigger
after insert or update of quantity, low_stock_threshold on public.inventory
for each row execute function public.sync_variant_stock_status();

alter table public.profiles enable row level security;
alter table public.brands enable row level security;
alter table public.categories enable row level security;
alter table public.pet_types enable row level security;
alter table public.products enable row level security;
alter table public.product_pet_types enable row level security;
alter table public.product_variants enable row level security;
alter table public.variant_costs enable row level security;
alter table public.inventory enable row level security;
alter table public.stock_movements enable row level security;
alter table public.price_history enable row level security;
alter table public.product_aliases enable row level security;
alter table public.import_batches enable row level security;
alter table public.import_rows enable row level security;
alter table public.customers enable row level security;
alter table public.pets enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.store_settings enable row level security;

create policy "Public brands are readable" on public.brands for select using (active);
create policy "Staff manage brands" on public.brands for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "Public categories are readable" on public.categories for select using (active);
create policy "Staff manage categories" on public.categories for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "Public pet types are readable" on public.pet_types for select using (active);
create policy "Staff manage pet types" on public.pet_types for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "Public products are readable" on public.products for select using (published and active);
create policy "Staff manage products" on public.products for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "Public product pets are readable" on public.product_pet_types for select using (
  exists (select 1 from public.products p where p.id = product_id and p.published and p.active)
);
create policy "Staff manage product pets" on public.product_pet_types for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "Public variants are readable" on public.product_variants for select using (
  active and exists (select 1 from public.products p where p.id = product_id and p.published and p.active)
);
create policy "Staff manage variants" on public.product_variants for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "Users read own profile" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "Staff manage profiles" on public.profiles for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "Public store settings are readable" on public.store_settings for select using (true);
create policy "Staff manage store settings" on public.store_settings for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "Staff manage variant costs" on public.variant_costs for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "Staff manage inventory" on public.inventory for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "Staff manage stock movements" on public.stock_movements for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "Staff manage price history" on public.price_history for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "Staff manage aliases" on public.product_aliases for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "Staff manage import batches" on public.import_batches for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "Staff manage import rows" on public.import_rows for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "Staff manage customers" on public.customers for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "Staff manage pets" on public.pets for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "Staff manage orders" on public.orders for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "Staff manage order items" on public.order_items for all to authenticated using (public.is_staff()) with check (public.is_staff());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "Product images are public"
on storage.objects for select
using (bucket_id = 'product-images');

create policy "Staff upload product images"
on storage.objects for insert to authenticated
with check (bucket_id = 'product-images' and public.is_staff());

create policy "Staff update product images"
on storage.objects for update to authenticated
using (bucket_id = 'product-images' and public.is_staff())
with check (bucket_id = 'product-images' and public.is_staff());

create policy "Staff delete product images"
on storage.objects for delete to authenticated
using (bucket_id = 'product-images' and public.is_staff());
