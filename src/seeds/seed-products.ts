import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Product } from '../products/product.entity';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME || 'proshop',
  entities: [Product],
  synchronize: false,
});

const PRODUCTS = [
  {
    nombre: 'Leggings Compresión Pro',
    descripcion: 'Leggings de alto rendimiento con tecnología de compresión graduada para mayor soporte muscular.',
    precio: 89900,
    precioAnterior: 119900,
    categoria: 'ropa',
    genero: ['W'],
    tallas: ['XS', 'S', 'M', 'L', 'XL'],
    rating: 4.8,
    reviews: 214,
    disponibles: 80,
    urlImagen: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&q=80',
  },
  {
    nombre: 'Camiseta Dry-Fit',
    descripcion: 'Camiseta técnica de secado rápido con tecnología de absorción de humedad para entrenamientos intensos.',
    precio: 49900,
    precioAnterior: 69900,
    categoria: 'ropa',
    genero: ['M', 'U'],
    tallas: ['S', 'M', 'L', 'XL'],
    rating: 4.7,
    reviews: 168,
    disponibles: 120,
    urlImagen: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&q=80',
  },
  {
    nombre: 'Short de Entrenamiento',
    descripcion: 'Short ligero y flexible ideal para running, crossfit y actividades de alta intensidad.',
    precio: 59900,
    precioAnterior: 79900,
    categoria: 'ropa',
    genero: ['M', 'W', 'U'],
    tallas: ['S', 'M', 'L', 'XL'],
    rating: 4.6,
    reviews: 132,
    disponibles: 95,
    urlImagen: 'https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=800&q=80',
  },
  {
    nombre: 'Top Deportivo de Impacto',
    descripcion: 'Top deportivo de alto impacto con soporte reforzado y tejido transpirable de cuatro vías.',
    precio: 69900,
    precioAnterior: 94900,
    categoria: 'ropa',
    genero: ['W'],
    tallas: ['XS', 'S', 'M', 'L'],
    rating: 4.9,
    reviews: 189,
    disponibles: 60,
    urlImagen: 'https://images.unsplash.com/photo-1552084117-56a987666449?w=800&q=80',
  },
  {
    nombre: 'Hoodie Performance',
    descripcion: 'Sudadera con capucha de tejido técnico, ideal para calentamiento y entrenamiento en exteriores.',
    precio: 129900,
    precioAnterior: 164900,
    categoria: 'ropa',
    genero: ['M', 'W', 'U'],
    tallas: ['S', 'M', 'L', 'XL', 'XXL'],
    rating: 4.7,
    reviews: 98,
    disponibles: 45,
    urlImagen: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800&q=80',
  },
  {
    nombre: 'Tenis Running Cloud',
    descripcion: 'Zapatillas de running con suela de amortiguación reactiva y parte superior de malla transpirable.',
    precio: 279900,
    precioAnterior: 349900,
    categoria: 'calzado',
    genero: ['M', 'W'],
    tallas: ['36', '37', '38', '39', '40', '41', '42', '43', '44'],
    rating: 4.9,
    reviews: 342,
    disponibles: 30,
    urlImagen: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
  },
  {
    nombre: 'Tenis Cross Training',
    descripcion: 'Calzado versátil para entrenamiento cruzado con suela plana estable y soporte lateral reforzado.',
    precio: 239900,
    precioAnterior: 299900,
    categoria: 'calzado',
    genero: ['M', 'W'],
    tallas: ['36', '37', '38', '39', '40', '41', '42', '43'],
    rating: 4.6,
    reviews: 211,
    disponibles: 40,
    urlImagen: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&q=80',
  },
  {
    nombre: 'Mochila Gym Pro 30L',
    descripcion: 'Mochila deportiva con compartimento separado para zapatos, bolsillo impermeable y puerto USB.',
    precio: 119900,
    precioAnterior: 149900,
    categoria: 'accesorios',
    genero: ['M', 'W', 'U'],
    tallas: ['U'],
    rating: 4.8,
    reviews: 157,
    disponibles: 55,
    urlImagen: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
  },
  {
    nombre: 'Guantes de Entrenamiento',
    descripcion: 'Guantes de entrenamiento con palma acolchada, muñequera de soporte y ventilación en dorso.',
    precio: 39900,
    precioAnterior: 54900,
    categoria: 'accesorios',
    genero: ['M', 'W', 'U'],
    tallas: ['S', 'M', 'L', 'XL'],
    rating: 4.5,
    reviews: 203,
    disponibles: 90,
    urlImagen: 'https://images.unsplash.com/photo-1590239926044-4131a4c88dab?w=800&q=80',
  },
  {
    nombre: 'Botella Térmica 1L',
    descripcion: 'Botella deportiva de acero inoxidable con doble pared, mantiene frío 24h o calor 12h.',
    precio: 64900,
    precioAnterior: 84900,
    categoria: 'accesorios',
    genero: ['M', 'W', 'U'],
    tallas: ['U'],
    rating: 4.7,
    reviews: 318,
    disponibles: 110,
    urlImagen: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80',
  },
  {
    nombre: 'Cuerda de Saltar Pro',
    descripcion: 'Cuerda de saltar con cable de acero recubierto, mangos ergonómicos y rodamientos de precisión.',
    precio: 34900,
    precioAnterior: 44900,
    categoria: 'equipos',
    genero: ['M', 'W', 'U'],
    tallas: ['U'],
    rating: 4.6,
    reviews: 145,
    disponibles: 75,
    urlImagen: 'https://images.unsplash.com/photo-1434682772747-f16d3ea162c3?w=800&q=80',
  },
  {
    nombre: 'Banda de Resistencia Set',
    descripcion: 'Set de 5 bandas elásticas de resistencia progresiva (5 a 40 kg) con bolsa de almacenamiento.',
    precio: 79900,
    precioAnterior: 99900,
    categoria: 'equipos',
    genero: ['M', 'W', 'U'],
    tallas: ['U'],
    rating: 4.8,
    reviews: 267,
    disponibles: 65,
    urlImagen: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=800&q=80',
  },
  {
    nombre: 'Rodilleras de Compresión',
    descripcion: 'Rodilleras deportivas con compresión graduada para soporte articular durante el entrenamiento.',
    precio: 44900,
    precioAnterior: 59900,
    categoria: 'accesorios',
    genero: ['M', 'W', 'U'],
    tallas: ['S', 'M', 'L', 'XL'],
    rating: 4.5,
    reviews: 124,
    disponibles: 85,
    urlImagen: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
  },
  {
    nombre: 'Calcetines Deportivos Pack x3',
    descripcion: 'Pack de 3 pares de calcetines técnicos con amortiguación en zonas de impacto y tejido antiolor.',
    precio: 29900,
    precioAnterior: 39900,
    categoria: 'ropa',
    genero: ['M', 'W', 'U'],
    tallas: ['S', 'M', 'L'],
    rating: 4.4,
    reviews: 389,
    disponibles: 150,
    urlImagen: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=800&q=80',
  },
  {
    nombre: 'Tapete de Yoga 6mm',
    descripcion: 'Tapete antideslizante de 6mm con marcas de alineación, correa de transporte y tejido ecológico.',
    precio: 89900,
    precioAnterior: 114900,
    categoria: 'equipos',
    genero: ['M', 'W', 'U'],
    tallas: ['U'],
    rating: 4.9,
    reviews: 276,
    disponibles: 70,
    urlImagen: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800&q=80',
  },
];

async function seed() {
  await AppDataSource.initialize();
  console.log('✅ Conexión a PostgreSQL establecida');

  const repo = AppDataSource.getRepository(Product);

  // Verificar si ya hay productos
  const count = await repo.count();
  if (count > 0) {
    console.log(`⚠️  Ya existen ${count} productos en la BD. Limpiando...`);
    await repo.clear();
    console.log('🗑️  Productos anteriores eliminados');
  }

  for (const data of PRODUCTS) {
    const product = repo.create(data);
    await repo.save(product);
    console.log(`✅ Insertado: ${data.nombre}`);
  }

  console.log(`\n🎉 Seed completo: ${PRODUCTS.length} productos insertados`);
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('❌ Error en seed:', err);
  process.exit(1);
});
