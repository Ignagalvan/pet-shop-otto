do $$
declare
  test_checkout_key uuid := '00000000-0000-0000-0000-000000000100';
  test_variant_id uuid;
  test_customer_id uuid;
  test_order_id uuid;
  staff_id uuid;
  before_quantity numeric(12,3);
  after_quantity numeric(12,3);
  package_price numeric(12,2);
  first_result jsonb;
  duplicate_result jsonb;
  expected_order_number text;
  reopen_was_blocked boolean := false;
begin
  select
    variant.id,
    inventory.quantity,
    variant.package_price
  into
    test_variant_id,
    before_quantity,
    package_price
  from public.product_variants variant
  join public.products product on product.id = variant.product_id
  join public.inventory inventory on inventory.variant_id = variant.id
  where product.active
    and product.published
    and variant.active
    and variant.sells_by_package
    and variant.package_price > 0
    and inventory.quantity >= 1
  order by inventory.quantity desc, variant.id
  limit 1
  for update of inventory;

  if test_variant_id is null then
    raise exception 'No hay una variante publicada con stock para probar pedidos.';
  end if;

  select id
  into staff_id
  from public.profiles
  where role in ('owner', 'admin', 'staff')
  order by case role when 'owner' then 0 when 'admin' then 1 else 2 end
  limit 1;

  if staff_id is null then
    raise exception 'No hay una cuenta administrativa para probar cancelaciones.';
  end if;

  first_result := public.create_public_order(
    test_checkout_key,
    jsonb_build_object(
      'name', 'Verificación automática',
      'phone', '3510000000',
      'email', 'verificacion@example.com',
      'pet', 'Otto'
    ),
    jsonb_build_object('type', 'retiro'),
    'transferencia',
    jsonb_build_array(
      jsonb_build_object(
        'variantId', test_variant_id,
        'mode', 'package',
        'quantity', 1
      )
    )
  );

  test_order_id := (first_result->>'id')::uuid;

  select customer_id
  into test_customer_id
  from public.orders
  where id = test_order_id;

  select format(
    'OTTO-%s-%s',
    extract(year from created_at)::integer,
    lpad(order_number::text, 6, '0')
  )
  into expected_order_number
  from public.orders
  where id = test_order_id;

  if test_customer_id is null
    or (first_result->>'orderNumber') <> expected_order_number
    or (first_result->>'subtotal')::numeric <> package_price
    or (first_result->>'shipping')::numeric <> 0
    or (first_result->>'total')::numeric <> package_price then
    raise exception 'La orden creada no contiene los datos o totales esperados.';
  end if;

  if (
    select count(*)
    from public.order_items
    where order_id = test_order_id
  ) <> 1 then
    raise exception 'La orden de prueba no guardó exactamente un producto.';
  end if;

  select quantity
  into after_quantity
  from public.inventory
  where variant_id = test_variant_id;

  if after_quantity <> before_quantity - 1 then
    raise exception 'El pedido no descontó correctamente el stock.';
  end if;

  duplicate_result := public.create_public_order(
    test_checkout_key,
    jsonb_build_object(
      'name', 'Verificación automática',
      'phone', '3510000000',
      'email', 'verificacion@example.com'
    ),
    jsonb_build_object('type', 'retiro'),
    'transferencia',
    jsonb_build_array(
      jsonb_build_object(
        'variantId', test_variant_id,
        'mode', 'package',
        'quantity', 1
      )
    )
  );

  if (duplicate_result->>'id')::uuid <> test_order_id
    or (select count(*) from public.orders where checkout_key = test_checkout_key) <> 1
    or (select quantity from public.inventory where variant_id = test_variant_id)
      <> before_quantity - 1 then
    raise exception 'La protección contra pedidos duplicados falló.';
  end if;

  perform set_config('request.jwt.claim.sub', staff_id::text, true);
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', staff_id)::text,
    true
  );

  perform public.update_order_status(test_order_id, 'cancelled');

  if (select status from public.orders where id = test_order_id) <> 'cancelled'
    or (select quantity from public.inventory where variant_id = test_variant_id)
      <> before_quantity then
    raise exception 'La cancelación no restauró correctamente el stock.';
  end if;

  begin
    perform public.update_order_status(test_order_id, 'confirmed');
  exception
    when others then
      if sqlerrm = 'Un pedido cancelado no se puede reabrir.' then
        reopen_was_blocked := true;
      else
        raise;
      end if;
  end;

  if not reopen_was_blocked then
    raise exception 'Fue posible reabrir un pedido cancelado.';
  end if;

  delete from public.stock_movements
  where reference_type = 'order'
    and reference_id = test_order_id::text;

  delete from public.orders
  where id = test_order_id;

  delete from public.customers
  where id = test_customer_id
    and auth_user_id is null;

  execute 'alter table public.orders alter column order_number restart with 1';

  if exists (
    select 1
    from public.orders
    where checkout_key = test_checkout_key
  ) or (select quantity from public.inventory where variant_id = test_variant_id)
    <> before_quantity then
    raise exception 'La prueba integral no pudo limpiar sus datos.';
  end if;
end;
$$;
