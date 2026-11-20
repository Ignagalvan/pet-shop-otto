-- Transfers remain available without banking details: coordinate via WhatsApp.
-- Never expose the placeholder account used during development.
update public.store_settings
set
  payment_methods = case
    when payment_methods ? 'transferencia' then payment_methods
    else payment_methods || '["transferencia"]'::jsonb
  end,
  transfer_alias = '',
  transfer_cbu = '',
  transfer_holder = '',
  transfer_bank = '',
  transfer_instructions = 'Te pasamos los datos por WhatsApp. No transfieras hasta confirmarlos con el local.',
  updated_at = now()
where id = true;

do $$
declare
  definition text;
  block_start integer;
  block_end integer;
begin
  definition := pg_get_functiondef('public.apply_store_settings_to_order()'::regprocedure);
  block_start := strpos(definition, '  if new.payment_method = ''transferencia'' then');
  block_end := strpos(definition, '  new.shipping_amount :=');
  if block_start = 0 or block_end <= block_start then
    raise exception 'Unexpected settings trigger definition; no changes applied.';
  end if;
  definition := substr(definition, 1, block_start - 1) || substr(definition, block_end);
  execute definition;
end;
$$;
