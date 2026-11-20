-- Owner requested keeping transfers disabled until real banking details are set.
update public.store_settings
set payment_methods = payment_methods - 'transferencia', updated_at = now()
where id = true and payment_methods ? 'transferencia';
