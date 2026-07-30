do $$
declare
  matched_count integer;
begin
  update public.products as product
  set
    description = coalesce(
      nullif(btrim(product.description), ''),
      description_map.description
    ),
    updated_at = now()
  from (
    values
      (
        'AGILITY GATO URINARY 10KG',
        'Alimento balanceado Agility Urinary para gatos adultos de 12 meses o más. Su fórmula acompaña la salud urinaria, el control del pH, el bienestar general y el cuidado de la piel y el pelaje. Presentación de 10 kg, disponible en bolsa cerrada o por kilo.'
      ),
      (
        'AGILITY PERRO ADULTO MORDIDA PEQUEÑA 15KG',
        'Alimento completo Agility para perros adultos de talla pequeña, desde los 12 meses. Brinda una nutrición equilibrada que acompaña el bienestar integral, la salud digestiva y el cuidado de huesos, dientes, piel y pelaje. Presentación de 15 kg, disponible en bolsa cerrada o por kilo.'
      ),
      (
        'AGILITY PERRO ADULTO 20KG',
        'Alimento completo Agility para perros adultos de talla mediana y grande, desde los 12 meses. Su fórmula acompaña una condición corporal óptima, una digestión saludable y el cuidado de huesos, dientes, piel y pelaje. Presentación de 20 kg, disponible en bolsa cerrada o por kilo.'
      ),
      (
        'VITAL CAN BALANCED CORDERO 3 KG',
        'Alimento Vitalcan Balanced Natural Recipe con cordero para perros adultos de todas las razas. Fórmula Skin Care sin trigo ni soja, elaborada con antioxidantes naturales para acompañar el cuidado diario de la piel y el bienestar general. Presentación de 3 kg.'
      ),
      (
        'VITAL CAN BALANCED CORDERO 15 KG',
        'Alimento Vitalcan Balanced Natural Recipe con cordero para perros adultos de todas las razas. Fórmula Skin Care sin trigo ni soja, elaborada con antioxidantes naturales para acompañar el cuidado diario de la piel y el bienestar general. Presentación de 15 kg, disponible en bolsa cerrada o por kilo.'
      ),
      (
        'SIEGER PERRO SENIOR MORDIDA MEDIANA 3KG',
        'Alimento Sieger Senior para perros mayores de talla mediana y grande. Su fórmula con probióticos e inulina acompaña la digestión, la tonicidad muscular y el cuidado de articulaciones y huesos durante la etapa senior. Presentación de 3 kg.'
      ),
      (
        'SIEGER ADULTO MORDIDA PEQUEÑA 3KG',
        'Alimento Sieger Adult para perros adultos de talla mini y pequeña. Su fórmula con probióticos e inulina acompaña la salud digestiva, la masa muscular, la piel y el pelaje, con croquetas adaptadas a bocas pequeñas. Presentación de 3 kg.'
      ),
      (
        'SIEGER ADULTO MORDIDA PEQUEÑA 12KG',
        'Alimento Sieger Adult para perros adultos de talla mini y pequeña. Su fórmula con probióticos e inulina acompaña la salud digestiva, la masa muscular, la piel y el pelaje, con croquetas adaptadas a bocas pequeñas. Presentación de 12 kg, disponible en bolsa cerrada o por kilo.'
      ),
      (
        'SIEGER PUPPY MORDIDA MEDIANA 3KG',
        'Alimento Sieger Puppy para cachorros de talla mediana y grande. Su fórmula con probióticos e inulina acompaña las defensas naturales, el aprendizaje, el desarrollo óseo y el crecimiento saludable. Presentación de 3 kg.'
      ),
      (
        'SIEGER PUPPY MORDIDA MEDIANA 15KG',
        'Alimento Sieger Puppy para cachorros de talla mediana y grande. Su fórmula con probióticos e inulina acompaña las defensas naturales, el aprendizaje, el desarrollo óseo y el crecimiento saludable. Presentación de 15 kg, disponible en bolsa cerrada o por kilo.'
      ),
      (
        'SIEGER PUPPY MORDIDA PEQUEÑA 3KG',
        'Alimento Sieger Puppy para cachorros de talla mini y pequeña. Su fórmula con probióticos e inulina acompaña las defensas naturales, el aprendizaje, el desarrollo muscular y el crecimiento saludable, con croquetas adaptadas a bocas pequeñas. Presentación de 3 kg.'
      ),
      (
        'DR DIPI GATO ADULTO 10 KG',
        'Alimento completo y balanceado Dr. Dipi para gatos adultos de todas las razas. Contiene omega 3 y 6 y está formulado para acompañar una piel sana, un pelaje brillante y el control de las bolas de pelo. Presentación de 10 kg, disponible en bolsa cerrada o por kilo.'
      ),
      (
        'DR DIPI PERRO ADULTO 20 KG',
        'Alimento completo y balanceado Dr. Dipi para perros adultos. Una opción de alimentación diaria pensada para cubrir las necesidades nutricionales de perros adultos de diferentes razas. Presentación de 20 kg, disponible en bolsa cerrada o por kilo.'
      ),
      (
        'LEVEL GATO 10 KG',
        'Alimento Level Premium para gatos adultos de todas las razas, con omega 3 y 6. Su fórmula acompaña el control del pH y la salud del tracto urinario, además del cuidado del corazón, el peso, la masa muscular, la piel y el pelaje. Presentación de 10 kg, disponible en bolsa cerrada o por kilo.'
      ),
      (
        'LEVEL PERRO ADULTO 20 KG',
        'Alimento Level Premium con pollo y arroz para perros adultos de todas las razas. Su fórmula acompaña el sistema inmune, la digestión y el cuidado de la piel, el pelaje, los huesos y los dientes. Presentación de 20 kg, disponible en bolsa cerrada o por kilo.'
      ),
      (
        'LEVEL PERRO ADULTO MORDIDA PEQUEÑA 10 KG',
        'Alimento Level Premium con pollo y arroz para perros adultos de raza pequeña, desde los 12 meses. Su fórmula acompaña la digestión, las defensas naturales, la piel y el pelaje, con croquetas adecuadas para perros pequeños. Presentación de 10 kg, disponible en bolsa cerrada o por kilo.'
      )
  ) as description_map(product_name, description)
  where regexp_replace(upper(trim(product.name)), '\s+', ' ', 'g')
      = regexp_replace(upper(trim(description_map.product_name)), '\s+', ' ', 'g');

  get diagnostics matched_count = row_count;

  if matched_count <> 16 then
    raise exception
      'Expected to match 16 products for descriptions, but matched %.',
      matched_count;
  end if;
end;
$$;
