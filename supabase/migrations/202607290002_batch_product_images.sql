do $$
declare
  updated_count integer;
begin
  update public.products as product
  set
    image_path = image_map.image_path,
    updated_at = now()
  from (
    values
      ('AGILITY PERRO ADULTO 20KG', 'catalog/agility-perro-adulto-mediano-grande-20kg.jpeg'),
      ('AGILITY PERRO ADULTO MORDIDA PEQUEÑA 15KG', 'catalog/agility-perro-adulto-talla-pequena-15kg.jpeg'),
      ('VITAL CAN BALANCED CORDERO 3 KG', 'catalog/vital-can-balanced-cordero-3kg-15kg.jpeg'),
      ('VITAL CAN BALANCED CORDERO 15 KG', 'catalog/vital-can-balanced-cordero-3kg-15kg.jpeg'),
      ('SIEGER PERRO SENIOR MORDIDA MEDIANA 3KG', 'catalog/sieger-perro-senior-mediano-3kg.jpeg'),
      ('SIEGER ADULTO MORDIDA PEQUEÑA 3KG', 'catalog/sieger-perro-adulto-pequeno-3kg-12kg.jpeg'),
      ('SIEGER ADULTO MORDIDA PEQUEÑA 12KG', 'catalog/sieger-perro-adulto-pequeno-3kg-12kg.jpeg'),
      ('SIEGER PUPPY MORDIDA MEDIANA 3KG', 'catalog/sieger-puppy-mediano-3kg-15kg.jpeg'),
      ('SIEGER PUPPY MORDIDA MEDIANA 15KG', 'catalog/sieger-puppy-mediano-3kg-15kg.jpeg'),
      ('SIEGER PUPPY MORDIDA PEQUEÑA 3KG', 'catalog/sieger-puppy-pequeno-3kg.jpeg'),
      ('DR DIPI GATO ADULTO 10 KG', 'catalog/dr-dipi-gato-adulto-10kg.jpeg'),
      ('DR DIPI PERRO ADULTO 20 KG', 'catalog/dr-dipi-perro-adulto-20kg.jpeg'),
      ('LEVEL GATO 10 KG', 'catalog/level-gato-adulto-10kg.jpeg'),
      ('LEVEL PERRO ADULTO 20 KG', 'catalog/level-perro-adulto-20kg.jpeg'),
      ('LEVEL PERRO ADULTO MORDIDA PEQUEÑA 10 KG', 'catalog/level-perro-adulto-pequeno-10kg.jpeg')
  ) as image_map(product_name, image_path)
  where regexp_replace(upper(trim(product.name)), '\s+', ' ', 'g')
      = regexp_replace(upper(trim(image_map.product_name)), '\s+', ' ', 'g')
    and product.image_path is null;

  get diagnostics updated_count = row_count;

  if updated_count <> 15 then
    raise exception
      'Expected to attach 15 product images, but attached %.',
      updated_count;
  end if;
end;
$$;
