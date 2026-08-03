import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Product } from '../products/product.entity';
import { ProductVariant } from '../products/product-variant.entity';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME || 'proshop',
  entities: [Product, ProductVariant],
  synchronize: false,
});

// 'U' = sin variante (color único / talla única)
// Combina color + size: una fila = una combinación única en inventario

const PRODUCTS: Array<{
  name: string;
  description: string;
  price: number;
  previousPrice?: number;
  categories: string[];
  gender: string[];
  rating: number;
  reviews: number;
  imageUrl: string;
  variants: { color: string; size: string; available: number; specialPrice?: number; imageUrl?: string }[];
}> = [
  {
    name: 'Leggings Compresión Pro',
    description: 'Leggings de alto rendimiento con tecnología de compresión graduada.',
    price: 89900, previousPrice: 119900, categories: ['ropa'],
    gender: ['W'], rating: 4.8, reviews: 214,
    imageUrl: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&q=80',
    variants: [
      // NEGRO
      { color: 'NEGRO', size: 'XS', available: 5 },
      { color: 'NEGRO', size: 'S',  available: 10 },
      { color: 'NEGRO', size: 'M',  available: 12 },
      { color: 'NEGRO', size: 'L',  available: 8 },
      { color: 'NEGRO', size: 'XL', available: 4 },
      // MORADO — en promoción
      { color: 'MORADO', size: 'XS', available: 3 },
      { color: 'MORADO', size: 'S',  available: 8, specialPrice: 74900 },
      { color: 'MORADO', size: 'M',  available: 10, specialPrice: 74900 },
      { color: 'MORADO', size: 'L',  available: 6 },
      { color: 'MORADO', size: 'XL', available: 2 },
    ],
  },
  {
    name: 'Camiseta Dry-Fit',
    description: 'Camiseta técnica de secado rápido con tecnología de absorción de humedad.',
    price: 49900, previousPrice: 69900, categories: ['ropa'],
    gender: ['M', 'U'], rating: 4.7, reviews: 168,
    imageUrl: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&q=80',
    variants: [
      { color: 'NEGRO',  size: 'S',  available: 15 },
      { color: 'NEGRO',  size: 'M',  available: 18 },
      { color: 'NEGRO',  size: 'L',  available: 14 },
      { color: 'NEGRO',  size: 'XL', available: 6 },
      { color: 'BLANCO', size: 'S',  available: 12 },
      { color: 'BLANCO', size: 'M',  available: 15 },
      { color: 'BLANCO', size: 'L',  available: 10 },
      { color: 'BLANCO', size: 'XL', available: 4 },
      { color: 'AZUL',   size: 'S',  available: 8 },
      { color: 'AZUL',   size: 'M',  available: 10 },
      { color: 'AZUL',   size: 'L',  available: 7 },
      { color: 'AZUL',   size: 'XL', available: 2 },
    ],
  },
  {
    name: 'Short de Entrenamiento',
    description: 'Short ligero y flexible ideal para running, crossfit y actividades de alta intensidad.',
    price: 59900, previousPrice: 79900, categories: ['ropa'],
    gender: ['M', 'W', 'U'], rating: 4.6, reviews: 132,
    imageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=800&q=80',
    variants: [
      { color: 'NEGRO', size: 'S',  available: 12 },
      { color: 'NEGRO', size: 'M',  available: 15 },
      { color: 'NEGRO', size: 'L',  available: 10 },
      { color: 'NEGRO', size: 'XL', available: 5 },
      { color: 'GRIS',  size: 'S',  available: 8 },
      { color: 'GRIS',  size: 'M',  available: 10 },
      { color: 'GRIS',  size: 'L',  available: 7 },
      { color: 'GRIS',  size: 'XL', available: 3 },
    ],
  },
  {
    name: 'Top Deportivo de Impacto',
    description: 'Top deportivo de alto impacto con soporte reforzado y tejido transpirable.',
    price: 69900, previousPrice: 94900, categories: ['ropa'],
    gender: ['W'], rating: 4.9, reviews: 189,
    imageUrl: 'https://images.unsplash.com/photo-1552084117-56a987666449?w=800&q=80',
    variants: [
      { color: 'NEGRO',   size: 'XS', available: 6 },
      { color: 'NEGRO',   size: 'S',  available: 10 },
      { color: 'NEGRO',   size: 'M',  available: 8 },
      { color: 'NEGRO',   size: 'L',  available: 3 },
      { color: 'CORAL',   size: 'XS', available: 5 },
      { color: 'CORAL',   size: 'S',  available: 8 },
      { color: 'CORAL',   size: 'M',  available: 7 },
      { color: 'CORAL',   size: 'L',  available: 2 },
    ],
  },
  {
    name: 'Hoodie Performance',
    description: 'Sudadera con capucha de tejido técnico, ideal para calentamiento.',
    price: 129900, previousPrice: 164900, categories: ['ropa'],
    gender: ['M', 'W', 'U'], rating: 4.7, reviews: 98,
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800&q=80',
    variants: [
      { color: 'NEGRO',   size: 'S',   available: 5 },
      { color: 'NEGRO',   size: 'M',   available: 8 },
      { color: 'NEGRO',   size: 'L',   available: 6 },
      { color: 'NEGRO',   size: 'XL',  available: 4 },
      { color: 'NEGRO',   size: 'XXL', available: 2 },
      { color: 'VERDE',   size: 'S',   available: 4 },
      { color: 'VERDE',   size: 'M',   available: 6 },
      { color: 'VERDE',   size: 'L',   available: 4 },
      { color: 'VERDE',   size: 'XL',  available: 3 },
    ],
  },
  {
    name: 'Tenis Running Cloud',
    description: 'Zapatillas de running con suela de amortiguación reactiva.',
    price: 279900, previousPrice: 349900, categories: ['equipos'],
    gender: ['M', 'W'], rating: 4.9, reviews: 342,
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
    variants: [
      { color: 'NEGRO', size: '36', available: 3 },
      { color: 'NEGRO', size: '37', available: 4 },
      { color: 'NEGRO', size: '38', available: 5 },
      { color: 'NEGRO', size: '39', available: 4 },
      { color: 'NEGRO', size: '40', available: 5 },
      { color: 'NEGRO', size: '41', available: 4 },
      { color: 'NEGRO', size: '42', available: 3 },
      { color: 'NEGRO', size: '43', available: 2 },
      { color: 'BLANCO', size: '36', available: 2 },
      { color: 'BLANCO', size: '37', available: 3 },
      { color: 'BLANCO', size: '38', available: 4 },
      { color: 'BLANCO', size: '39', available: 3 },
      { color: 'BLANCO', size: '40', available: 4 },
      { color: 'BLANCO', size: '41', available: 3 },
      { color: 'BLANCO', size: '42', available: 2 },
      { color: 'BLANCO', size: '43', available: 1 },
    ],
  },
  {
    name: 'Tenis Cross Training',
    description: 'Calzado versátil para entrenamiento cruzado con suela plana estable.',
    price: 239900, previousPrice: 299900, categories: ['equipos'],
    gender: ['M', 'W'], rating: 4.6, reviews: 211,
    imageUrl: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&q=80',
    variants: [
      { color: 'NEGRO', size: '36', available: 3 },
      { color: 'NEGRO', size: '37', available: 4 },
      { color: 'NEGRO', size: '38', available: 5 },
      { color: 'NEGRO', size: '39', available: 4 },
      { color: 'NEGRO', size: '40', available: 6 },
      { color: 'NEGRO', size: '41', available: 4 },
      { color: 'NEGRO', size: '42', available: 3 },
      { color: 'GRIS',  size: '38', available: 4 },
      { color: 'GRIS',  size: '39', available: 3 },
      { color: 'GRIS',  size: '40', available: 5 },
      { color: 'GRIS',  size: '41', available: 3 },
      { color: 'GRIS',  size: '42', available: 2 },
    ],
  },
  {
    name: 'Mochila Gym Pro 30L',
    description: 'Mochila deportiva con compartimento separado para zapatos y puerto USB.',
    price: 119900, previousPrice: 149900, categories: ['accesorios'],
    gender: ['M', 'W', 'U'], rating: 4.8, reviews: 157,
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
    // Sin selección de talla, pero con opción de color
    variants: [
      { color: 'NEGRO',  size: 'U', available: 25 },
      { color: 'GRIS',   size: 'U', available: 18 },
      { color: 'AZUL',   size: 'U', available: 12 },
    ],
  },
  {
    name: 'Guantes de Entrenamiento',
    description: 'Guantes con palma acolchada, muñequera de soporte y ventilación.',
    price: 39900, previousPrice: 54900, categories: ['accesorios'],
    gender: ['M', 'W', 'U'], rating: 4.5, reviews: 203,
    imageUrl: 'https://images.unsplash.com/photo-1590239926044-4131a4c88dab?w=800&q=80',
    variants: [
      { color: 'NEGRO', size: 'S',  available: 12 },
      { color: 'NEGRO', size: 'M',  available: 18 },
      { color: 'NEGRO', size: 'L',  available: 15 },
      { color: 'NEGRO', size: 'XL', available: 8 },
    ],
  },
  {
    name: 'Botella Térmica 1L',
    description: 'Botella de acero inoxidable con doble pared, mantiene frío 24h.',
    price: 64900, previousPrice: 84900, categories: ['accesorios'],
    gender: ['M', 'W', 'U'], rating: 4.7, reviews: 318,
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80',
    // Sin talla, con opción de color
    variants: [
      { color: 'NEGRO',    size: 'U', available: 40 },
      { color: 'PLATA',    size: 'U', available: 35 },
      { color: 'ROJO',     size: 'U', available: 20, specialPrice: 54900 },
      { color: 'AZUL',     size: 'U', available: 15 },
    ],
  },
  {
    name: 'Cuerda de Saltar Pro',
    description: 'Cable de acero recubierto con mangos ergonómicos y rodamientos de precisión.',
    price: 34900, previousPrice: 44900, categories: ['equipos'],
    gender: ['M', 'W', 'U'], rating: 4.6, reviews: 145,
    imageUrl: 'https://images.unsplash.com/photo-1434682772747-f16d3ea162c3?w=800&q=80',
    // Un solo color, sin talla → 'U'/'U'
    variants: [
      { color: 'U', size: 'U', available: 75 },
    ],
  },
  {
    name: 'Banda de Resistencia Set',
    description: 'Set de 5 bandas elásticas de resistencia progresiva (5 a 40 kg).',
    price: 79900, previousPrice: 99900, categories: ['equipos'],
    gender: ['M', 'W', 'U'], rating: 4.8, reviews: 267,
    imageUrl: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=800&q=80',
    variants: [
      { color: 'U', size: 'U', available: 65 },
    ],
  },
  {
    name: 'Rodilleras de Compresión',
    description: 'Compresión graduada para soporte articular durante el entrenamiento.',
    price: 44900, previousPrice: 59900, categories: ['accesorios'],
    gender: ['M', 'W', 'U'], rating: 4.5, reviews: 124,
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
    variants: [
      { color: 'NEGRO', size: 'S',  available: 12 },
      { color: 'NEGRO', size: 'M',  available: 16 },
      { color: 'NEGRO', size: 'L',  available: 12 },
      { color: 'NEGRO', size: 'XL', available: 6 },
    ],
  },
  {
    name: 'Calcetines Deportivos Pack x3',
    description: 'Pack de 3 pares con amortiguación en zonas de impacto y tejido antiolor.',
    price: 29900, previousPrice: 39900, categories: ['ropa'],
    gender: ['M', 'W', 'U'], rating: 4.4, reviews: 389,
    imageUrl: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=800&q=80',
    // Sin selección de color, con talla de pie
    variants: [
      { color: 'U', size: 'S', available: 40 },
      { color: 'U', size: 'M', available: 60 },
      { color: 'U', size: 'L', available: 50 },
    ],
  },
  {
    name: 'Tapete de Yoga 6mm',
    description: 'Tapete antideslizante con marcas de alineación y tejido ecológico.',
    price: 89900, previousPrice: 114900, categories: ['equipos'],
    gender: ['M', 'W', 'U'], rating: 4.9, reviews: 276,
    imageUrl: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800&q=80',
    variants: [
      { color: 'NEGRO',  size: 'U', available: 25 },
      { color: 'MORADO', size: 'U', available: 20, specialPrice: 79900 },
      { color: 'VERDE',  size: 'U', available: 15 },
      { color: 'AZUL',   size: 'U', available: 10 },
    ],
  },
];

async function seed() {
  await AppDataSource.initialize();
  console.log('✅ Conexión a PostgreSQL establecida');

  const productRepo = AppDataSource.getRepository(Product);
  const variantRepo = AppDataSource.getRepository(ProductVariant);

  // Limpiar datos anteriores
  const count = await productRepo.count();
  if (count > 0) {
    console.log(`⚠️  Limpiando ${count} productos existentes...`);
    await variantRepo.delete({});
    await productRepo.delete({});
  }

  for (const data of PRODUCTS) {
    const { variants, ...productData } = data;

    const product = productRepo.create(productData);
    const saved = await productRepo.save(product);

    for (const v of variants) {
      const variant = variantRepo.create({ productId: saved.id, ...v });
      await variantRepo.save(variant);
    }

    // Stats
    const uniqueColors = [...new Set(variants.map((v) => v.color))].filter((c) => c !== 'U');
    const uniqueSizes  = [...new Set(variants.map((v) => v.size))].filter((s) => s !== 'U');
    const totalStock   = variants.reduce((sum, v) => sum + v.available, 0);
    const hasPromo     = variants.some((v) => v.specialPrice);

    console.log(
      `✅ ${saved.name}` +
      (uniqueColors.length > 0 ? ` | Colores: ${uniqueColors.join(', ')}` : '') +
      (uniqueSizes.length  > 0 ? ` | Tallas: ${uniqueSizes.join(', ')}` : ' | Talla única') +
      ` | Stock total: ${totalStock}` +
      (hasPromo ? ' 🏷️ promo' : ''),
    );
  }

  console.log(`\n🎉 Seed completo: ${PRODUCTS.length} productos, variantes por color+talla`);
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('❌ Error en seed:', err);
  process.exit(1);
});
