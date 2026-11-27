-- Immediate purchases must always reserve real stock, including products that
-- also accept special orders. No existing product, stock or order is modified.
begin;
do $patch$
declare src text; guard text; bypass text;
begin
  select pg_get_functiondef('public.create_public_order_legacy(uuid,jsonb,jsonb,text,jsonb)'::regprocedure) into src;
  guard := '    if not item_record.on_request and item_record.stock_status <> ''on_request'' then';
  bypass := E'    else\n      stock_delta := 0;\n    end if;';
  if position(guard in src)=0 or position(bypass in src)=0 then raise exception 'Unexpected checkout function; stock validation migration aborted'; end if;
  src := replace(src,guard,'    begin');
  src := replace(src,bypass,'    end;');
  execute src;
end; $patch$;
notify pgrst, 'reload schema';
commit;
