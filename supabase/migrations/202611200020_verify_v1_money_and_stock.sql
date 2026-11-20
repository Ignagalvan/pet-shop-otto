-- Transactional production regression test for the V1 money/stock invariants.
-- Every test record is removed before this migration commits.
do $$
declare
  test_key uuid := gen_random_uuid();
  test_variant_id uuid;
  test_owner_id uuid;
  test_order_id uuid;
  test_customer_id uuid;
  before_stock numeric(12,3);
  response jsonb;
  retry_response jsonb;
  blocked_paid_on_cancelled boolean := false;
begin
  select variant.id, inventory.quantity
  into test_variant_id, before_stock
  from public.product_variants variant
  join public.products product on product.id = variant.product_id
  join public.inventory inventory on inventory.variant_id = variant.id
  where variant.active
    and variant.sells_by_package
    and coalesce(variant.package_price, 0) > 0
    and product.active
    and product.published
    and not product.on_request
    and variant.stock_status <> 'on_request'
    and inventory.quantity >= 1
  order by inventory.quantity desc, variant.id
  limit 1;

  if test_variant_id is null then
    raise exception 'V1 verification needs one published product with stock.';
  end if;

  select id
  into test_owner_id
  from public.profiles
  where role in ('owner', 'admin')
  order by case when role = 'owner' then 0 else 1 end, created_at
  limit 1;

  if test_owner_id is null then
    raise exception 'V1 verification needs an owner/admin profile.';
  end if;

  perform set_config('request.jwt.claim.sub', test_owner_id::text, true);

  response := public.create_public_order(
    test_key,
    jsonb_build_object(
      'name', 'Verificación V1',
      'phone', '0000000000',
      'email', 'v1-check@petshopotto.test'
    ),
    jsonb_build_object('type', 'retiro'),
    'local',
    jsonb_build_array(
      jsonb_build_object(
        'variantId', test_variant_id,
        'mode', 'package',
        'quantity', 1
      )
    )
  );

  test_order_id := (response->>'id')::uuid;

  select customer_id
  into test_customer_id
  from public.orders
  where id = test_order_id;

  if response->>'paymentMethod' <> 'local'
    or response->>'paymentStatus' <> 'pending'
    or jsonb_array_length(response->'items') <> 1 then
    raise exception 'Checkout did not return the persisted pending order.';
  end if;

  if (select quantity from public.inventory where variant_id = test_variant_id)
    <> before_stock - 1 then
    raise exception 'Checkout did not decrement stock exactly once.';
  end if;

  perform public.update_order_payment_status(test_order_id, 'paid');

  retry_response := public.create_public_order(
    test_key,
    jsonb_build_object(
      'name', 'Intento de cambio',
      'phone', '1111111111',
      'email', 'retry@petshopotto.test'
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

  if retry_response->>'paymentMethod' <> 'local'
    or retry_response->>'paymentStatus' <> 'paid' then
    raise exception 'Idempotent retry changed an existing payment.';
  end if;

  if (select quantity from public.inventory where variant_id = test_variant_id)
    <> before_stock - 1 then
    raise exception 'Idempotent retry changed stock.';
  end if;

  perform public.update_order_status(test_order_id, 'cancelled');

  if (select quantity from public.inventory where variant_id = test_variant_id)
    <> before_stock then
    raise exception 'Cancellation did not restore stock.';
  end if;

  if (select payment_status from public.orders where id = test_order_id)
    <> 'paid' then
    raise exception 'Cancellation erased the received-payment signal.';
  end if;

  perform public.update_order_payment_status(test_order_id, 'pending');
  begin
    perform public.update_order_payment_status(test_order_id, 'paid');
  exception when others then
    blocked_paid_on_cancelled := true;
  end;

  if not blocked_paid_on_cancelled then
    raise exception 'A cancelled order was incorrectly marked paid.';
  end if;

  perform public.update_order_status(test_order_id, 'confirmed');

  if (select quantity from public.inventory where variant_id = test_variant_id)
    <> before_stock - 1 then
    raise exception 'Reactivation did not reserve stock again.';
  end if;

  perform public.update_order_status(test_order_id, 'cancelled');

  delete from public.activity_logs where entity_id = test_order_id::text;
  delete from public.stock_movements
  where reference_type = 'order' and reference_id = test_order_id::text;
  delete from public.orders where id = test_order_id;
  delete from public.customers where id = test_customer_id;

  if (select quantity from public.inventory where variant_id = test_variant_id)
    <> before_stock then
    raise exception 'Verification cleanup left inventory changed.';
  end if;
end;
$$;
