insert into public.categories (name, slug, sort_order)
values
  ('Alimentos', 'alimentos', 10),
  ('Snacks', 'snacks', 20),
  ('Juguetes', 'juguetes', 30),
  ('Higiene', 'higiene', 40),
  ('Camas y descanso', 'camas', 50),
  ('Paseo', 'paseo', 60),
  ('Accesorios', 'accesorios', 70),
  ('Semillas y granja', 'semillas-granja', 80),
  ('Otros', 'otros', 90)
on conflict (slug) do update
set name = excluded.name, sort_order = excluded.sort_order;

insert into public.pet_types (name, slug, sort_order)
values
  ('Perros', 'perros', 10),
  ('Gatos', 'gatos', 20),
  ('Aves', 'aves', 30),
  ('Peces', 'peces', 40),
  ('Roedores', 'roedores', 50),
  ('Caballos', 'caballos', 60),
  ('Otras mascotas', 'otras', 70)
on conflict (slug) do update
set name = excluded.name, sort_order = excluded.sort_order;

insert into public.store_settings (
  id,
  store_name,
  instagram,
  address,
  business_hours
)
values (
  true,
  'Pet Shop Otto',
  'pet_shop.otto',
  'General Paz 62, Salsipuedes, Córdoba',
  '{
    "timezone": "America/Argentina/Cordoba",
    "monday": [["08:30", "13:00"], ["16:30", "20:30"]],
    "tuesday": [["08:30", "13:00"], ["16:30", "20:30"]],
    "wednesday": [["08:30", "13:00"], ["16:30", "20:30"]],
    "thursday": [["08:30", "13:00"], ["16:30", "20:30"]],
    "friday": [["08:30", "13:00"], ["16:30", "20:30"]],
    "saturday": [["08:30", "13:00"], ["16:30", "20:30"]],
    "sunday": []
  }'::jsonb
)
on conflict (id) do update
set
  store_name = excluded.store_name,
  instagram = excluded.instagram,
  address = excluded.address,
  business_hours = excluded.business_hours;
