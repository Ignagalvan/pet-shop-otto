do $$
declare
  function_definition text;
  fixed_definition text;
  declaration_before text := '  available_quantity numeric(12,3);';
  declaration_after text := E'  available_quantity numeric(12,3);\n  planned_stock jsonb := ''{}''::jsonb;\n  planned_delta numeric(12,3);';
  validation_before text := E'      if available_quantity is null or available_quantity + 0.000001 < stock_delta then\n        raise exception ''No hay stock suficiente de %.'', item_record.product_name;\n      end if;';
  validation_after text := E'      planned_delta :=\n        coalesce((planned_stock->>item_record.id::text)::numeric, 0) + stock_delta;\n\n      if available_quantity is null or available_quantity + 0.000001 < planned_delta then\n        raise exception ''No hay stock suficiente de %.'', item_record.product_name;\n      end if;\n\n      planned_stock := jsonb_set(\n        planned_stock,\n        array[item_record.id::text],\n        to_jsonb(planned_delta),\n        true\n      );';
begin
  select pg_get_functiondef(
    'public.create_public_order(uuid,jsonb,jsonb,text,jsonb)'::regprocedure
  )
  into function_definition;

  fixed_definition := replace(
    function_definition,
    declaration_before,
    declaration_after
  );
  fixed_definition := replace(
    fixed_definition,
    validation_before,
    validation_after
  );

  if fixed_definition = function_definition
    or position(declaration_after in fixed_definition) = 0
    or position(validation_after in fixed_definition) = 0 then
    raise exception 'No se pudo agregar la validación combinada de stock.';
  end if;

  execute fixed_definition;
end;
$$;
