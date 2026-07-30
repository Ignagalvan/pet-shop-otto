create table if not exists public.activity_logs (
  id bigint generated always as identity primary key,
  category text not null check (
    category in ('orders', 'catalog', 'stock', 'imports', 'settings')
  ),
  event_type text not null,
  entity_type text,
  entity_id text,
  title text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  actor_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists activity_logs_created_at_idx
  on public.activity_logs(created_at desc);
create index if not exists activity_logs_category_created_at_idx
  on public.activity_logs(category, created_at desc);
create index if not exists activity_logs_entity_idx
  on public.activity_logs(entity_type, entity_id);

alter table public.activity_logs enable row level security;

create policy "Staff read activity logs"
on public.activity_logs
for select
to authenticated
using (public.is_staff());

create or replace function public.order_status_label(p_status public.order_status)
returns text
language sql
immutable
parallel safe
set search_path = public
as $$
  select case p_status
    when 'pending' then 'Nuevo'
    when 'confirmed' then 'Confirmado'
    when 'preparing' then 'Preparando'
    when 'ready' then 'Listo'
    when 'completed' then 'Entregado'
    when 'cancelled' then 'Cancelado'
  end;
$$;

revoke all on function public.order_status_label(public.order_status) from public;

create or replace function public.log_order_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_number text;
  customer_name text;
begin
  display_number := format(
    'OTTO-%s-%s',
    extract(year from new.created_at)::integer,
    lpad(new.order_number::text, 6, '0')
  );
  customer_name := coalesce(
    nullif(trim(new.customer_snapshot->>'name'), ''),
    'Sin nombre'
  );

  if tg_op = 'INSERT' then
    insert into public.activity_logs (
      category,
      event_type,
      entity_type,
      entity_id,
      title,
      description,
      metadata,
      actor_id,
      created_at
    )
    values (
      'orders',
      'order_created',
      'order',
      new.id::text,
      'Nuevo pedido ' || display_number,
      customer_name || ' realizó un pedido por ' ||
        to_char(new.total, 'FM$999G999G999G990'),
      jsonb_build_object(
        'orderNumber', display_number,
        'status', new.status,
        'total', new.total,
        'customerName', customer_name
      ),
      (select auth.uid()),
      new.created_at
    );
  elsif old.status is distinct from new.status then
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
      'order_status_changed',
      'order',
      new.id::text,
      'Pedido ' || display_number || ' actualizado',
      'Pasó de ' || public.order_status_label(old.status) ||
        ' a ' || public.order_status_label(new.status) || '.',
      jsonb_build_object(
        'orderNumber', display_number,
        'previousStatus', old.status,
        'status', new.status,
        'customerName', customer_name
      ),
      (select auth.uid())
    );
  end if;

  return new;
end;
$$;

create trigger orders_activity_trigger
after insert or update of status on public.orders
for each row execute function public.log_order_activity();

create or replace function public.log_product_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  event_name text := 'product_updated';
  detail text := 'Se actualizaron los datos del producto.';
begin
  if old.published is distinct from new.published then
    event_name := case when new.published then 'product_published' else 'product_unpublished' end;
    detail := case
      when new.published then 'El producto quedó visible en la tienda.'
      else 'El producto dejó de estar visible en la tienda.'
    end;
  elsif old.image_path is distinct from new.image_path then
    event_name := 'product_image_changed';
    detail := case
      when new.image_path is null then 'Se eliminó la imagen del producto.'
      else 'Se actualizó la imagen del producto.'
    end;
  end if;

  if old.name is distinct from new.name
    or old.description is distinct from new.description
    or old.brand_id is distinct from new.brand_id
    or old.category_id is distinct from new.category_id
    or old.image_path is distinct from new.image_path
    or old.published is distinct from new.published
    or old.featured is distinct from new.featured
    or old.on_request is distinct from new.on_request
    or old.active is distinct from new.active then
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
      'catalog',
      event_name,
      'product',
      new.id::text,
      'Producto actualizado: ' || new.name,
      detail,
      jsonb_build_object(
        'name', new.name,
        'published', new.published,
        'featured', new.featured,
        'onRequest', new.on_request
      ),
      (select auth.uid())
    );
  end if;

  return new;
end;
$$;

create trigger products_activity_trigger
after update on public.products
for each row execute function public.log_product_activity();

create or replace function public.log_variant_price_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  product_name text;
begin
  if old.package_price is distinct from new.package_price
    or old.kg_price is distinct from new.kg_price then
    select product.name
    into product_name
    from public.products product
    where product.id = new.product_id;

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
      'catalog',
      'price_changed',
      'product',
      new.product_id::text,
      'Precio actualizado: ' || coalesce(product_name, 'Producto'),
      'Se modificó el precio de venta.',
      jsonb_build_object(
        'variantId', new.id,
        'previousPackagePrice', old.package_price,
        'packagePrice', new.package_price,
        'previousKgPrice', old.kg_price,
        'kgPrice', new.kg_price
      ),
      (select auth.uid())
    );
  end if;

  return new;
end;
$$;

create trigger product_variants_price_activity_trigger
after update of package_price, kg_price on public.product_variants
for each row execute function public.log_variant_price_activity();

create or replace function public.log_manual_stock_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  product_id_value uuid;
  product_name text;
begin
  if new.reference_type = 'product'
    or new.reason ilike 'Edición manual%' then
    select product.id, product.name
    into product_id_value, product_name
    from public.product_variants variant
    join public.products product on product.id = variant.product_id
    where variant.id = new.variant_id;

    insert into public.activity_logs (
      category,
      event_type,
      entity_type,
      entity_id,
      title,
      description,
      metadata,
      actor_id,
      created_at
    )
    values (
      'stock',
      'stock_changed',
      'product',
      product_id_value::text,
      'Stock actualizado: ' || coalesce(product_name, 'Producto'),
      case
        when new.quantity_change > 0 then
          'Se agregaron ' || trim(to_char(new.quantity_change, 'FM999G999G990D999')) || ' unidades.'
        else
          'Se descontaron ' || trim(to_char(abs(new.quantity_change), 'FM999G999G990D999')) || ' unidades.'
      end,
      jsonb_build_object(
        'variantId', new.variant_id,
        'quantityChange', new.quantity_change,
        'reason', new.reason
      ),
      coalesce(new.created_by, (select auth.uid())),
      new.created_at
    );
  end if;

  return new;
end;
$$;

create trigger stock_movements_activity_trigger
after insert on public.stock_movements
for each row execute function public.log_manual_stock_activity();

create or replace function public.log_import_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'applied'
    and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    insert into public.activity_logs (
      category,
      event_type,
      entity_type,
      entity_id,
      title,
      description,
      metadata,
      actor_id,
      created_at
    )
    values (
      'imports',
      'import_applied',
      'import_batch',
      new.id::text,
      'Importación aplicada: ' || new.file_name,
      new.total_rows || ' filas procesadas, ' ||
        new.new_rows || ' productos nuevos y ' ||
        new.review_rows || ' observaciones.',
      jsonb_build_object(
        'fileName', new.file_name,
        'totalRows', new.total_rows,
        'newRows', new.new_rows,
        'updatedRows', new.updated_rows,
        'reviewRows', new.review_rows
      ),
      coalesce(new.uploaded_by, (select auth.uid())),
      coalesce(new.applied_at, now())
    );
  end if;

  return new;
end;
$$;

create trigger import_batches_activity_trigger
after insert or update of status on public.import_batches
for each row execute function public.log_import_activity();

create or replace function public.log_settings_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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
    'settings',
    'settings_updated',
    'store_settings',
    'main',
    'Configuración del negocio actualizada',
    'Se modificaron datos de contacto, horarios, entregas o formas de pago.',
    jsonb_build_object('storeName', new.store_name),
    (select auth.uid())
  );

  return new;
end;
$$;

create trigger store_settings_activity_trigger
after update on public.store_settings
for each row execute function public.log_settings_activity();

insert into public.activity_logs (
  category,
  event_type,
  entity_type,
  entity_id,
  title,
  description,
  metadata,
  actor_id,
  created_at
)
select
  'orders',
  'order_created',
  'order',
  orders.id::text,
  'Pedido ' || format(
    'OTTO-%s-%s',
    extract(year from orders.created_at)::integer,
    lpad(orders.order_number::text, 6, '0')
  ),
  coalesce(nullif(orders.customer_snapshot->>'name', ''), 'Sin nombre') ||
    ' realizó un pedido por ' || to_char(orders.total, 'FM$999G999G999G990'),
  jsonb_build_object(
    'orderNumber', format(
      'OTTO-%s-%s',
      extract(year from orders.created_at)::integer,
      lpad(orders.order_number::text, 6, '0')
    ),
    'status', orders.status,
    'total', orders.total,
    'customerName', orders.customer_snapshot->>'name'
  ),
  null,
  orders.created_at
from public.orders orders;

insert into public.activity_logs (
  category,
  event_type,
  entity_type,
  entity_id,
  title,
  description,
  metadata,
  actor_id,
  created_at
)
select
  'imports',
  'import_applied',
  'import_batch',
  batch.id::text,
  'Importación aplicada: ' || batch.file_name,
  batch.total_rows || ' filas procesadas, ' ||
    batch.new_rows || ' productos nuevos y ' ||
    batch.review_rows || ' observaciones.',
  jsonb_build_object(
    'fileName', batch.file_name,
    'totalRows', batch.total_rows,
    'newRows', batch.new_rows,
    'updatedRows', batch.updated_rows,
    'reviewRows', batch.review_rows
  ),
  batch.uploaded_by,
  coalesce(batch.applied_at, batch.created_at)
from public.import_batches batch
where batch.status = 'applied';

create or replace function public.get_admin_activity(
  p_category text default 'all',
  p_search text default '',
  p_limit integer default 30,
  p_offset integer default 0
)
returns table (
  id bigint,
  category text,
  event_type text,
  entity_type text,
  entity_id text,
  title text,
  description text,
  metadata jsonb,
  actor_name text,
  created_at timestamptz,
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
  with filtered as (
    select
      activity.id,
      activity.category,
      activity.event_type,
      activity.entity_type,
      activity.entity_id,
      activity.title,
      activity.description,
      activity.metadata,
      coalesce(
        profile.full_name,
        case
          when activity.event_type = 'order_created' then 'Tienda online'
          else 'Sistema'
        end
      ) as actor_name,
      activity.created_at
    from public.activity_logs activity
    left join public.profiles profile on profile.id = activity.actor_id
    where (
      coalesce(p_category, 'all') = 'all'
      or activity.category = p_category
    )
      and (
        trim(coalesce(p_search, '')) = ''
        or activity.title ilike '%' || trim(p_search) || '%'
        or coalesce(activity.description, '') ilike '%' || trim(p_search) || '%'
        or coalesce(profile.full_name, '') ilike '%' || trim(p_search) || '%'
      )
  )
  select
    filtered.id,
    filtered.category,
    filtered.event_type,
    filtered.entity_type,
    filtered.entity_id,
    filtered.title,
    filtered.description,
    filtered.metadata,
    filtered.actor_name,
    filtered.created_at,
    count(*) over() as total_count
  from filtered
  order by filtered.created_at desc, filtered.id desc
  limit least(greatest(coalesce(p_limit, 30), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

revoke all on function public.get_admin_activity(text, text, integer, integer)
  from public, anon;
grant execute on function public.get_admin_activity(text, text, integer, integer)
  to authenticated;
