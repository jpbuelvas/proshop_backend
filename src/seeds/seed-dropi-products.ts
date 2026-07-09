/**
 * Seed manual de productos Dropi.
 * Corre desde TU MAQUINA LOCAL (no desde el sandbox):
 *   cd proshop_backend
 *   npx ts-node -r tsconfig-paths/register src/seeds/seed-dropi-products.ts
 */
import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';
import { DataSource } from 'typeorm';
import { Product } from '../products/product.entity';
import { ProductVariant } from '../products/product-variant.entity';

const KEY = process.env.DROPI_API_KEY ?? '';
const BASE = process.env.DROPI_BASE_URL ?? 'https://api.dropi.co/v1';
const H = { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Accept: 'application/json' };

interface ProductData {
  name: string;
  description: string;
  price: number;
  previousPrice?: number;
  category: string;
  gender: string[];
  imageUrl: string;
}

// Datos manuales como fallback (del screenshot + tus favoritos)
const MANUAL: Record<number, ProductData> = {
  1689694: {
    name: 'Cepillo De Limpieza Bio Brush 9 En 1',
    description: 'Cepillo de limpieza facial y corporal 9 en 1. Tecnologia bioelectrica para limpieza profunda, exfoliacion, masaje y cuidado de la piel. Incluye multiples cabezales intercambiables.',
    price: 85000,
    previousPrice: 52000,
    category: 'belleza',
    gender: ['mujer', 'hombre'],
    imageUrl: '',
  },
  1173076: {
    // Completa estos datos con los de tu producto favorito #2 o editalo desde el Admin Panel
    name: 'Producto Dropi 1173076',
    description: 'Descripcion pendiente. Edita desde el Admin Panel.',
    price: 0,
    category: 'general',
    gender: ['hombre', 'mujer'],
    imageUrl: '',
  },
};

async function fetchFromDropi(productId: number): Promise<ProductData | null> {
  const endpoints = [
    `${BASE}/integrations/products/${productId}`,
    `${BASE}/products/${productId}`,
    `https://api.dropi.co/integrations/products/${productId}`,
  ];

  for (const url of endpoints) {
    try {
      const r = await axios.get(url, { headers: H, timeout: 8000 });
      const d = r.data;
      const obj = d?.objects?.[0] ?? d?.data ?? d;
      if (obj && (obj.name ?? obj.nombre)) {
        console.log(`  API OK [${url}]: ${obj.name ?? obj.nombre}`);
        return {
          name: obj.name ?? obj.nombre ?? '',
          description: obj.description ?? obj.descripcion ?? '',
          price: Number(obj.suggested_price ?? obj.precio ?? obj.price ?? 0),
          previousPrice: Number(obj.original_price ?? 0) || undefined,
          category: obj.category?.name ?? obj.categoria ?? 'general',
          gender: obj.gender ? [obj.gender] : ['hombre', 'mujer'],
          imageUrl: obj.main_image ?? obj.image ?? obj.imagenUrl ?? '',
        };
      }
    } catch (e: any) {
      const s = e?.response?.status ?? 'ERR';
      const m = String(e?.response?.data?.message ?? e?.message ?? '').slice(0, 100);
      console.log(`  ${url} -> ${s}: ${m}`);
    }
  }
  return null;
}

async function main() {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5433),
    username: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? '1234',
    database: process.env.DB_NAME ?? 'proshop',
    entities: [Product, ProductVariant],
    synchronize: false,
    ssl: false,
  });

  await ds.initialize();
  const productRepo = ds.getRepository(Product);
  const variantRepo = ds.getRepository(ProductVariant);

  const dropiIds = [1689694, 1173076];

  for (const dropiId of dropiIds) {
    console.log(`\n=== Importando producto Dropi ID ${dropiId} ===`);

    let data = await fetchFromDropi(dropiId);

    if (!data) {
      console.log('  API no disponible - usando datos manuales');
      data = MANUAL[dropiId];
    }

    if (!data) {
      console.log('  Sin datos, skipping');
      continue;
    }

    // Verificar si ya existe
    const existing = await productRepo.findOne({ where: { dropiProductId: dropiId } });

    if (existing) {
      console.log(`  Ya existe como producto #${existing.id} - actualizando`);
      existing.name = data.name;
      existing.description = data.description;
      existing.price = data.price;
      (existing as any).previousPrice = data.previousPrice ?? null;
      existing.category = data.category;
      existing.gender = data.gender;
      if (data.imageUrl) existing.imageUrl = data.imageUrl;
      await productRepo.save(existing);
      console.log('  Actualizado OK');
    } else {
      const product = new Product();
      product.name = data.name;
      product.description = data.description;
      product.price = data.price;
      (product as any).previousPrice = data.previousPrice ?? null;
      product.category = data.category;
      product.gender = data.gender;
      product.imageUrl = data.imageUrl;
      product.dropiProductId = dropiId;
      product.reviews = 0;

      const saved = await productRepo.save(product);

      const variant = new ProductVariant();
      variant.color = 'U';
      variant.size = 'U';
      variant.available = 50;
      variant.productId = saved.id;
      await variantRepo.save(variant);

      console.log(`  Creado producto #${saved.id}: "${saved.name}" @ $${saved.price}`);
    }
  }

  await ds.destroy();
  console.log('\nListo! Abre el Admin Panel para ajustar fotos, descripcion y precio del producto 1173076.');
}

main().catch((e) => { console.error(e); process.exit(1); });
