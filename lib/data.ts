import type {
  CategorySlug,
  PetType,
  Product,
} from './types'

export const BRAND_NAME = 'Pet Shop Otto'
export const BRAND_SUFFIX = ''
export const BRAND_FULL_NAME = [BRAND_NAME, BRAND_SUFFIX].filter(Boolean).join(' ')
export const WHATSAPP_NUMBER = '5491100000000' // Reemplazar por el número real

export const petTypes: { slug: PetType; label: string; image: string }[] = [
  { slug: 'perros', label: 'Perros', image: '/images/pet-dog.png' },
  { slug: 'gatos', label: 'Gatos', image: '/images/pet-cat.png' },
  { slug: 'aves', label: 'Aves', image: '/images/pet-bird.png' },
  { slug: 'roedores', label: 'Roedores', image: '/images/pet-rodent.png' },
  { slug: 'caballos', label: 'Caballos', image: '/images/pet-horse-v2.png' },
  { slug: 'otras', label: 'Otras mascotas', image: '/images/pet-other-v2.png' },
]

export const categories: {
  slug: CategorySlug
  label: string
  icon: string
  description: string
}[] = [
  { slug: 'alimentos', label: 'Alimentos', icon: 'bone', description: 'Balanceados y húmedos' },
  { slug: 'snacks', label: 'Snacks', icon: 'cookie', description: 'Premios y golosinas' },
  { slug: 'juguetes', label: 'Juguetes', icon: 'gamepad-2', description: 'Diversión asegurada' },
  { slug: 'higiene', label: 'Higiene', icon: 'droplets', description: 'Baño y cuidado' },
  { slug: 'camas', label: 'Camas', icon: 'bed-double', description: 'Descanso y confort' },
  { slug: 'paseo', label: 'Paseo', icon: 'footprints', description: 'Correas y arneses' },
  { slug: 'accesorios', label: 'Accesorios', icon: 'shopping-bag', description: 'Comederos y más' },
]

export const brands = [
  'NutriCan',
  'FelinePro',
  'DentalBite',
  'PlayPet',
  'CleanPet',
  'MaxCat',
  'CozyNest',
  'UrbanPet',
]

export const needsList: { slug: string; label: string }[] = [
  { slug: 'cachorros', label: 'Cachorros' },
  { slug: 'adultos', label: 'Adultos' },
  { slug: 'senior', label: 'Senior' },
  { slug: 'cuidado-especial', label: 'Cuidado especial' },
  { slug: 'control-peso', label: 'Control de peso' },
  { slug: 'piel-sensible', label: 'Piel sensible' },
]

function reviews(base: string): Product['reviews'] {
  return [
    {
      id: base + '-r1',
      author: 'Martina G.',
      rating: 5,
      date: 'Hace 2 semanas',
      text: 'Excelente calidad y llegó súper rápido. Mi mascota lo adora.',
    },
    {
      id: base + '-r2',
      author: 'Lucas P.',
      rating: 4,
      date: 'Hace 1 mes',
      text: 'Muy buen producto, la relación precio-calidad es muy buena.',
    },
    {
      id: base + '-r3',
      author: 'Sofía R.',
      rating: 5,
      date: 'Hace 1 mes',
      text: 'Atención por WhatsApp impecable, me ayudaron a elegir.',
    },
  ]
}

export const products: Product[] = [
  {
    id: 'p1',
    slug: 'nutrican-adulto-razas-medianas-15kg',
    name: 'Alimento Balanceado Adulto Razas Medianas',
    brand: 'NutriCan',
    image: '/images/prod-dog-food.png',
    petTypes: ['perros'],
    category: 'alimentos',
    presentation: '15 kg',
    price: 42500,
    oldPrice: 51000,
    installments: '3 cuotas sin interés de $ 14.166',
    stock: 'disponible',
    stockCount: 24,
    lifeStage: 'adulto',
    tags: ['oferta', 'mas-vendido'],
    needs: ['adultos'],
    rating: 4.8,
    reviewsCount: 214,
    featured: true,
    description:
      'Alimento super premium formulado para perros adultos de razas medianas. Con proteínas de alta calidad, omega 3 y 6 para un pelaje brillante y una digestión saludable.',
    benefits: [
      'Pelaje brillante y piel sana',
      'Digestión equilibrada',
      'Sistema inmune fortalecido',
    ],
    features: [
      { label: 'Etapa', value: 'Adulto' },
      { label: 'Raza', value: 'Medianas' },
      { label: 'Peso', value: '15 kg' },
      { label: 'Sabor', value: 'Pollo y cereales' },
    ],
    ingredients: 'Pollo deshidratado, arroz, maíz, grasa animal, pulpa de remolacha, vitaminas y minerales.',
    usage: 'Servir la ración diaria recomendada según el peso del animal, con agua fresca disponible.',
    important: 'Realizar la transición de alimento de forma gradual durante 7 días.',
    variants: [
      { id: 'v1', label: '3 kg', price: 12500 },
      { id: 'v2', label: '7,5 kg', price: 24900 },
      { id: 'v3', label: '15 kg', price: 42500 },
    ],
    reviews: reviews('p1'),
  },
  {
    id: 'p2',
    slug: 'felinepro-salmon-7-5kg',
    name: 'Alimento para Gatos Salmón',
    brand: 'FelinePro',
    image: '/images/prod-cat-food.png',
    petTypes: ['gatos'],
    category: 'alimentos',
    presentation: '7,5 kg',
    price: 38900,
    installments: '3 cuotas sin interés de $ 12.966',
    stock: 'disponible',
    stockCount: 18,
    lifeStage: 'adulto',
    tags: ['mas-vendido'],
    needs: ['adultos'],
    rating: 4.7,
    reviewsCount: 156,
    featured: true,
    description:
      'Alimento premium con salmón real como primer ingrediente. Favorece el control de bolas de pelo y cuida el sistema urinario de tu gato.',
    benefits: ['Control de bolas de pelo', 'Cuida el sistema urinario', 'Alta palatabilidad'],
    features: [
      { label: 'Etapa', value: 'Adulto' },
      { label: 'Peso', value: '7,5 kg' },
      { label: 'Sabor', value: 'Salmón' },
    ],
    ingredients: 'Salmón, arroz, proteína de ave, taurina, vitaminas y minerales.',
    usage: 'Ofrecer la porción diaria dividida en dos tomas.',
    variants: [
      { id: 'v1', label: '1,5 kg', price: 9900 },
      { id: 'v2', label: '7,5 kg', price: 38900 },
    ],
    reviews: reviews('p2'),
  },
  {
    id: 'p3',
    slug: 'dentalbite-snacks-dentales',
    name: 'Snacks Dentales para Perro',
    brand: 'DentalBite',
    image: '/images/prod-dental-snacks.png',
    petTypes: ['perros'],
    category: 'snacks',
    presentation: 'Pack x 7 unidades',
    price: 6800,
    oldPrice: 8500,
    stock: 'poco',
    stockCount: 4,
    lifeStage: 'adulto',
    tags: ['oferta', 'ultimas'],
    rating: 4.6,
    reviewsCount: 89,
    featured: true,
    description:
      'Snacks masticables que ayudan a reducir el sarro y refrescar el aliento mientras tu perro se divierte.',
    benefits: ['Reduce el sarro', 'Refresca el aliento', 'Textura que masajea las encías'],
    features: [
      { label: 'Unidades', value: '7' },
      { label: 'Uso', value: 'Diario' },
    ],
    reviews: reviews('p3'),
  },
  {
    id: 'p4',
    slug: 'playpet-cuerda-resistente',
    name: 'Cuerda de Juego Resistente',
    brand: 'PlayPet',
    image: '/images/prod-rope-toy.png',
    petTypes: ['perros'],
    category: 'juguetes',
    presentation: 'Talle M',
    price: 4900,
    stock: 'disponible',
    stockCount: 40,
    lifeStage: 'todos',
    tags: ['nuevo'],
    rating: 4.5,
    reviewsCount: 42,
    featured: true,
    description:
      'Cuerda de algodón trenzado ideal para juegos de tironeo. Resistente y segura para las encías.',
    benefits: ['Resistente al mordisqueo', 'Ayuda a la higiene dental', 'Fomenta el juego activo'],
    features: [
      { label: 'Material', value: 'Algodón' },
      { label: 'Talle', value: 'Mediano' },
    ],
    variants: [
      { id: 'v1', label: 'Talle S', price: 3500 },
      { id: 'v2', label: 'Talle M', price: 4900 },
      { id: 'v3', label: 'Talle L', price: 6200 },
    ],
    reviews: reviews('p4'),
  },
  {
    id: 'p5',
    slug: 'playpet-varita-plumas',
    name: 'Varita con Plumas para Gato',
    brand: 'PlayPet',
    image: '/images/prod-cat-wand.png',
    petTypes: ['gatos'],
    category: 'juguetes',
    presentation: 'Unidad',
    price: 3200,
    stock: 'disponible',
    stockCount: 33,
    lifeStage: 'todos',
    tags: ['nuevo', 'mas-vendido'],
    rating: 4.9,
    reviewsCount: 120,
    featured: true,
    description:
      'Varita interactiva con plumas naturales que estimula el instinto cazador y el ejercicio de tu gato.',
    benefits: ['Estimula el juego', 'Fomenta el ejercicio', 'Fortalece el vínculo'],
    features: [
      { label: 'Material', value: 'Plumas naturales' },
      { label: 'Largo', value: '45 cm' },
    ],
    reviews: reviews('p5'),
  },
  {
    id: 'p6',
    slug: 'cleanpet-shampoo-hipoalergenico',
    name: 'Shampoo Hipoalergénico',
    brand: 'CleanPet',
    image: '/images/prod-shampoo.png',
    petTypes: ['perros', 'gatos'],
    category: 'higiene',
    presentation: '500 ml',
    price: 7400,
    installments: '3 cuotas sin interés de $ 2.466',
    stock: 'disponible',
    stockCount: 15,
    lifeStage: 'todos',
    tags: [],
    needs: ['piel-sensible', 'cuidado-especial'],
    rating: 4.7,
    reviewsCount: 64,
    description:
      'Shampoo suave con avena coloidal, ideal para pieles sensibles. pH balanceado para perros y gatos.',
    benefits: ['Apto piel sensible', 'Con avena coloidal', 'pH balanceado'],
    features: [
      { label: 'Volumen', value: '500 ml' },
      { label: 'Aroma', value: 'Neutro' },
    ],
    ingredients: 'Base lavante suave, avena coloidal, glicerina, aloe vera.',
    reviews: reviews('p6'),
  },
  {
    id: 'p7',
    slug: 'maxcat-arena-aglutinante-10kg',
    name: 'Arena Sanitaria Aglutinante',
    brand: 'MaxCat',
    image: '/images/prod-cat-litter.png',
    petTypes: ['gatos'],
    category: 'higiene',
    presentation: '10 kg',
    price: 15900,
    oldPrice: 18900,
    stock: 'disponible',
    stockCount: 21,
    lifeStage: 'todos',
    tags: ['oferta'],
    rating: 4.6,
    reviewsCount: 98,
    description:
      'Arena de rápida aglutinación con control de olores prolongado. Bajo nivel de polvo.',
    benefits: ['Control de olores', 'Aglutinación rápida', 'Bajo polvo'],
    features: [
      { label: 'Peso', value: '10 kg' },
      { label: 'Tipo', value: 'Aglutinante' },
    ],
    reviews: reviews('p7'),
  },
  {
    id: 'p8',
    slug: 'cozynest-cama-ortopedica',
    name: 'Cama Ortopédica',
    brand: 'CozyNest',
    image: '/images/prod-dog-bed.png',
    petTypes: ['perros', 'gatos'],
    category: 'camas',
    presentation: 'Talle L',
    price: 32900,
    oldPrice: 39900,
    installments: '6 cuotas sin interés de $ 5.483',
    stock: 'poco',
    stockCount: 3,
    lifeStage: 'senior',
    tags: ['oferta', 'ultimas'],
    needs: ['senior', 'cuidado-especial'],
    rating: 4.8,
    reviewsCount: 51,
    featured: true,
    description:
      'Cama con espuma viscoelástica que cuida las articulaciones. Funda desmontable y lavable.',
    benefits: ['Espuma viscoelástica', 'Funda lavable', 'Ideal para senior'],
    features: [
      { label: 'Talle', value: 'Large' },
      { label: 'Relleno', value: 'Viscoelástico' },
    ],
    variants: [
      { id: 'v1', label: 'Talle M', price: 26900 },
      { id: 'v2', label: 'Talle L', price: 32900 },
    ],
    reviews: reviews('p8'),
  },
  {
    id: 'p9',
    slug: 'cozynest-cueva-gatos',
    name: 'Cueva de Descanso para Gatos',
    brand: 'CozyNest',
    image: '/images/prod-cat-cave.png',
    petTypes: ['gatos'],
    category: 'camas',
    presentation: 'Unidad',
    price: 18500,
    stock: 'disponible',
    stockCount: 12,
    lifeStage: 'todos',
    tags: ['nuevo'],
    rating: 4.7,
    reviewsCount: 37,
    description:
      'Cueva de fieltro suave que brinda un refugio cálido y seguro para el descanso de tu gato.',
    benefits: ['Refugio cálido', 'Fieltro suave', 'Diseño moderno'],
    features: [
      { label: 'Material', value: 'Fieltro' },
      { label: 'Color', value: 'Crema' },
    ],
    reviews: reviews('p9'),
  },
  {
    id: 'p10',
    slug: 'urbanpet-correa-retractil',
    name: 'Correa Retráctil',
    brand: 'UrbanPet',
    image: '/images/prod-leash.png',
    petTypes: ['perros'],
    category: 'paseo',
    presentation: '5 m',
    price: 11900,
    installments: '3 cuotas sin interés de $ 3.966',
    stock: 'disponible',
    stockCount: 9,
    lifeStage: 'todos',
    tags: [],
    rating: 4.5,
    reviewsCount: 73,
    description:
      'Correa retráctil de 5 metros con freno de bloqueo y mango ergonómico para paseos cómodos y seguros.',
    benefits: ['Freno de bloqueo', 'Mango ergonómico', 'Cinta reflectante'],
    features: [
      { label: 'Largo', value: '5 m' },
      { label: 'Hasta', value: '25 kg' },
    ],
    reviews: reviews('p10'),
  },
  {
    id: 'p11',
    slug: 'urbanpet-collar-ajustable',
    name: 'Collar Ajustable con Placa',
    brand: 'UrbanPet',
    image: '/images/prod-collar.png',
    petTypes: ['perros', 'gatos'],
    category: 'accesorios',
    presentation: 'Talle M',
    price: 8900,
    stock: 'disponible',
    stockCount: 27,
    lifeStage: 'todos',
    tags: ['nuevo'],
    rating: 4.6,
    reviewsCount: 44,
    description:
      'Collar de cuero ecológico ajustable con placa identificatoria grabable. Elegante y resistente.',
    benefits: ['Placa grabable', 'Cuero ecológico', 'Hebilla resistente'],
    features: [
      { label: 'Material', value: 'Cuero ecológico' },
      { label: 'Talle', value: 'Ajustable' },
    ],
    variants: [
      { id: 'v1', label: 'Talle S', price: 7500 },
      { id: 'v2', label: 'Talle M', price: 8900 },
      { id: 'v3', label: 'Talle L', price: 9900 },
    ],
    reviews: reviews('p11'),
  },
  {
    id: 'p12',
    slug: 'urbanpet-comedero-doble-acero',
    name: 'Comedero Doble de Acero',
    brand: 'UrbanPet',
    image: '/images/prod-bowl.png',
    petTypes: ['perros', 'gatos'],
    category: 'accesorios',
    presentation: 'Unidad',
    price: 13400,
    oldPrice: 15900,
    stock: 'disponible',
    stockCount: 14,
    lifeStage: 'todos',
    tags: ['oferta'],
    rating: 4.7,
    reviewsCount: 58,
    description:
      'Comedero doble de acero inoxidable sobre soporte elevado. Higiénico, estable y fácil de limpiar.',
    benefits: ['Acero inoxidable', 'Base antideslizante', 'Altura ergonómica'],
    features: [
      { label: 'Material', value: 'Acero inox.' },
      { label: 'Capacidad', value: '2 x 400 ml' },
    ],
    reviews: reviews('p12'),
  },
  {
    id: 'p13',
    slug: 'nutrican-cachorros',
    name: 'Alimento para Cachorros',
    brand: 'NutriCan',
    image: '/images/prod-puppy-food.png',
    petTypes: ['perros'],
    category: 'alimentos',
    presentation: '3 kg',
    price: 15900,
    stock: 'disponible',
    stockCount: 20,
    lifeStage: 'cachorro',
    tags: ['mas-vendido'],
    needs: ['cachorros'],
    rating: 4.8,
    reviewsCount: 132,
    description:
      'Nutrición completa para el crecimiento de cachorros, con DHA para el desarrollo cerebral y calcio para huesos fuertes.',
    benefits: ['Con DHA', 'Huesos fuertes', 'Fácil digestión'],
    features: [
      { label: 'Etapa', value: 'Cachorro' },
      { label: 'Peso', value: '3 kg' },
    ],
    reviews: reviews('p13'),
  },
  {
    id: 'p14',
    slug: 'nutrican-senior-control-peso',
    name: 'Alimento Senior Control de Peso',
    brand: 'NutriCan',
    image: '/images/prod-senior-food.png',
    petTypes: ['perros'],
    category: 'alimentos',
    presentation: '7,5 kg',
    price: 29900,
    stock: 'agotado',
    stockCount: 0,
    lifeStage: 'senior',
    tags: [],
    needs: ['senior', 'control-peso'],
    rating: 4.6,
    reviewsCount: 47,
    description:
      'Formulado para perros senior con tendencia al sobrepeso. Bajo en grasas y con condroprotectores para las articulaciones.',
    benefits: ['Control de peso', 'Cuida articulaciones', 'Bajo en grasas'],
    features: [
      { label: 'Etapa', value: 'Senior' },
      { label: 'Peso', value: '7,5 kg' },
    ],
    reviews: reviews('p14'),
  },
  {
    id: 'p15',
    slug: 'maxcat-rascador-torre',
    name: 'Rascador Torre para Gatos',
    brand: 'MaxCat',
    image: '/images/prod-scratcher.png',
    petTypes: ['gatos'],
    category: 'accesorios',
    presentation: '80 cm',
    price: 45900,
    installments: '6 cuotas sin interés de $ 7.650',
    stock: 'pedido',
    lifeStage: 'todos',
    tags: [],
    rating: 4.7,
    reviewsCount: 29,
    description:
      'Torre rascadora con plataformas y cuevas. Producto disponible a pedido: lo conseguimos especialmente para vos.',
    benefits: ['Varias plataformas', 'Sisal resistente', 'Estable y seguro'],
    features: [
      { label: 'Altura', value: '80 cm' },
      { label: 'Material', value: 'Sisal y felpa' },
    ],
    important:
      'Este producto es a pedido. Confirmamos precio y plazo, y puede requerir una seña para iniciar el encargo.',
    reviews: reviews('p15'),
  },
  {
    id: 'p16',
    slug: 'felinepro-latas-humedo',
    name: 'Alimento Húmedo en Lata (Pack x6)',
    brand: 'FelinePro',
    image: '/images/prod-wet-food.png',
    petTypes: ['gatos', 'perros'],
    category: 'alimentos',
    presentation: 'Pack x 6 latas',
    price: 9600,
    oldPrice: 11400,
    stock: 'poco',
    stockCount: 5,
    lifeStage: 'todos',
    tags: ['oferta'],
    rating: 4.5,
    reviewsCount: 66,
    description:
      'Pack de alimento húmedo en trozos con salsa. Complemento ideal para una dieta variada y apetecible.',
    benefits: ['Alta palatabilidad', 'Extra hidratación', 'Práctico'],
    features: [
      { label: 'Unidades', value: '6 latas' },
      { label: 'Peso', value: '85 g c/u' },
    ],
    reviews: reviews('p16'),
  },
]

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug)
}

export function getFeatured(): Product[] {
  return products.filter((p) => p.featured)
}

export function getOffers(): Product[] {
  return products.filter((p) => p.tags.includes('oferta'))
}

export function getRelated(product: Product): Product[] {
  return products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .concat(
      products.filter(
        (p) =>
          p.id !== product.id &&
          p.category !== product.category &&
          p.petTypes.some((t) => product.petTypes.includes(t)),
      ),
    )
    .slice(0, 4)
}
