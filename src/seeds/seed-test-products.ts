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

// Inserta 5 productos de prueba por categoria SIN borrar los productos existentes.
const PRODUCTS: Array<{
  name: string;
  description: string;
  price: number;
  previousPrice?: number;
  categories: string[];
  gender: string[];
  imageUrl: string;
  variants: { color: string; size: string; available: number; specialPrice?: number }[];
}> = [
  // ── ROPA ──────────────────────────────────────────────────
  { name: '[Prueba] Camiseta Deportiva 1', description: 'Producto de prueba - ropa.', price: 39900, previousPrice: 49900, categories: ['ropa'], gender: ['U'], imageUrl: 'https://placehold.co/800x800/1a1a1a/fff?text=Ropa+1',
    variants: [{ color: 'NEGRO', size: 'S', available: 10 }, { color: 'NEGRO', size: 'M', available: 10 }] },
  { name: '[Prueba] Pantalón Jogger 2', description: 'Producto de prueba - ropa.', price: 69900, categories: ['ropa'], gender: ['M'], imageUrl: 'https://placehold.co/800x800/8a8a8a/fff?text=Ropa+2',
    variants: [{ color: 'GRIS', size: 'M', available: 8 }, { color: 'GRIS', size: 'L', available: 8 }] },
  { name: '[Prueba] Chaqueta Cortavientos 3', description: 'Producto de prueba - ropa.', price: 99900, previousPrice: 129900, categories: ['ropa'], gender: ['W'], imageUrl: 'https://placehold.co/800x800/1e40af/fff?text=Ropa+3',
    variants: [{ color: 'AZUL', size: 'S', available: 5 }, { color: 'AZUL', size: 'M', available: 5 }] },
  { name: '[Prueba] Shorts de Running 4', description: 'Producto de prueba - ropa.', price: 44900, categories: ['ropa'], gender: ['U'], imageUrl: 'https://placehold.co/800x800/166534/fff?text=Ropa+4',
    variants: [{ color: 'VERDE', size: 'M', available: 12 }, { color: 'VERDE', size: 'L', available: 6 }] },
  { name: '[Prueba] Sudadera con Capucha 5', description: 'Producto de prueba - ropa.', price: 89900, previousPrice: 109900, categories: ['ropa'], gender: ['U'], imageUrl: 'https://placehold.co/800x800/dc2626/fff?text=Ropa+5',
    variants: [{ color: 'ROJO', size: 'M', available: 7 }, { color: 'ROJO', size: 'L', available: 4 }] },

  // ── ACCESORIOS ────────────────────────────────────────────
  { name: '[Prueba] Gorra Deportiva 1', description: 'Producto de prueba - accesorios.', price: 29900, categories: ['accesorios'], gender: ['U'], imageUrl: 'https://placehold.co/800x800/1a1a1a/fff?text=Acc+1',
    variants: [{ color: 'NEGRO', size: 'U', available: 20 }] },
  { name: '[Prueba] Mochila Urbana 2', description: 'Producto de prueba - accesorios.', price: 79900, previousPrice: 99900, categories: ['accesorios'], gender: ['U'], imageUrl: 'https://placehold.co/800x800/8a8a8a/fff?text=Acc+2',
    variants: [{ color: 'GRIS', size: 'U', available: 15 }] },
  { name: '[Prueba] Guantes de Gimnasio 3', description: 'Producto de prueba - accesorios.', price: 34900, categories: ['accesorios'], gender: ['U'], imageUrl: 'https://placehold.co/800x800/1a1a1a/fff?text=Acc+3',
    variants: [{ color: 'NEGRO', size: 'M', available: 10 }, { color: 'NEGRO', size: 'L', available: 10 }] },
  { name: '[Prueba] Botella Deportiva 4', description: 'Producto de prueba - accesorios.', price: 24900, categories: ['accesorios'], gender: ['U'], imageUrl: 'https://placehold.co/800x800/c0c0c0/000?text=Acc+4',
    variants: [{ color: 'PLATA', size: 'U', available: 30 }] },
  { name: '[Prueba] Cinturón de Levantamiento 5', description: 'Producto de prueba - accesorios.', price: 59900, previousPrice: 74900, categories: ['accesorios'], gender: ['U'], imageUrl: 'https://placehold.co/800x800/92400e/fff?text=Acc+5',
    variants: [{ color: 'CAFE', size: 'M', available: 6 }, { color: 'CAFE', size: 'L', available: 6 }] },

  // ── EQUIPOS ───────────────────────────────────────────────
  { name: '[Prueba] Mancuernas Set 1', description: 'Producto de prueba - equipos.', price: 149900, categories: ['equipos'], gender: ['U'], imageUrl: 'https://placehold.co/800x800/1a1a1a/fff?text=Equipo+1',
    variants: [{ color: 'U', size: 'U', available: 10 }] },
  { name: '[Prueba] Balón Medicinal 2', description: 'Producto de prueba - equipos.', price: 69900, categories: ['equipos'], gender: ['U'], imageUrl: 'https://placehold.co/800x800/dc2626/fff?text=Equipo+2',
    variants: [{ color: 'ROJO', size: 'U', available: 12 }] },
  { name: '[Prueba] Cuerda de Saltar 3', description: 'Producto de prueba - equipos.', price: 29900, categories: ['equipos'], gender: ['U'], imageUrl: 'https://placehold.co/800x800/1a1a1a/fff?text=Equipo+3',
    variants: [{ color: 'U', size: 'U', available: 25 }] },
  { name: '[Prueba] Colchoneta de Yoga 4', description: 'Producto de prueba - equipos.', price: 79900, previousPrice: 99900, categories: ['equipos'], gender: ['U'], imageUrl: 'https://placehold.co/800x800/166534/fff?text=Equipo+4',
    variants: [{ color: 'VERDE', size: 'U', available: 18 }] },
  { name: '[Prueba] Banda de Resistencia 5', description: 'Producto de prueba - equipos.', price: 39900, categories: ['equipos'], gender: ['U'], imageUrl: 'https://placehold.co/800x800/7c3aed/fff?text=Equipo+5',
    variants: [{ color: 'MORADO', size: 'U', available: 22 }] },

  // ── OUTLET ────────────────────────────────────────────────
  { name: '[Prueba] Outlet Camiseta 1', description: 'Producto de prueba - outlet.', price: 19900, previousPrice: 39900, categories: ['outlet', 'ropa'], gender: ['U'], imageUrl: 'https://placehold.co/800x800/c8102e/fff?text=Outlet+1',
    variants: [{ color: 'NEGRO', size: 'M', available: 5 }] },
  { name: '[Prueba] Outlet Gorra 2', description: 'Producto de prueba - outlet.', price: 14900, previousPrice: 29900, categories: ['outlet', 'accesorios'], gender: ['U'], imageUrl: 'https://placehold.co/800x800/c8102e/fff?text=Outlet+2',
    variants: [{ color: 'GRIS', size: 'U', available: 8 }] },
  { name: '[Prueba] Outlet Short 3', description: 'Producto de prueba - outlet.', price: 24900, previousPrice: 44900, categories: ['outlet', 'ropa'], gender: ['U'], imageUrl: 'https://placehold.co/800x800/c8102e/fff?text=Outlet+3',
    variants: [{ color: 'AZUL', size: 'L', available: 6 }] },
  { name: '[Prueba] Outlet Cuerda 4', description: 'Producto de prueba - outlet.', price: 14900, previousPrice: 29900, categories: ['outlet', 'equipos'], gender: ['U'], imageUrl: 'https://placehold.co/800x800/c8102e/fff?text=Outlet+4',
    variants: [{ color: 'U', size: 'U', available: 14 }] },
  { name: '[Prueba] Outlet Botella 5', description: 'Producto de prueba - outlet.', price: 9900, previousPrice: 19900, categories: ['outlet', 'accesorios'], gender: ['U'], imageUrl: 'https://placehold.co/800x800/c8102e/fff?text=Outlet+5',
    variants: [{ color: 'PLATA', size: 'U', available: 20 }] },
];

async function seed() {
  await AppDataSource.initialize();
  console.log('✅ Conexión a PostgreSQL establecida');

  const productRepo = AppDataSource.getRepository(Product);
  const variantRepo = AppDataSource.getRepository(ProductVariant);

  for (const data of PRODUCTS) {
    const { variants, ...productData } = data;

    const product = productRepo.create(productData);
    const saved = await productRepo.save(product);

    for (const v of variants) {
      const variant = variantRepo.create({ productId: saved.id, ...v });
      await variantRepo.save(variant);
    }

    console.log(`✅ [${saved.categories.join(',')}] ${saved.name}`);
  }

  console.log(`\n🎉 Seed de prueba completo: ${PRODUCTS.length} productos agregados (sin borrar los existentes)`);
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('❌ Error en seed:', err);
  process.exit(1);
});
