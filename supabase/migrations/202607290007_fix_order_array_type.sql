do $$
declare
  function_definition text;
  fixed_definition text;
begin
  select pg_get_functiondef(
    'public.create_public_order(uuid,jsonb,jsonb,text,jsonb)'::regprocedure
  )
  into function_definition;

  fixed_definition := replace(
    function_definition,
    'seen_item_keys text[] := ''{}'';',
    'seen_item_keys text[] := array[]::text[];'
  );

  if fixed_definition = function_definition then
    raise exception 'No se encontró la inicialización de seen_item_keys para corregir.';
  end if;

  execute fixed_definition;
end;
$$;
