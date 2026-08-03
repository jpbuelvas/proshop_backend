/**
 * SCRIPT: importar productos favoritos de Dropi
 *
 * USO: npx ts-node -r tsconfig-paths/register src/seeds/import-dropi-products.ts
 *
 * Si falla con 404, primero corre discover-dropi-api.ts para encontrar el endpoint correcto.
 */
import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import { DataSource } from 'typeorm';
import { Product } from '../products/product.entity';
import { ProductVariant } from '../products/product-variant.entity';
import { User } from '../users/user.entity';
import { Order } from '../orders/order.entity';
import { OrderItem } from '../orders/order-item.entity';
import { Payment } from '../payments/payment.entity';
import { normalizeCategories } from '../products/product-category';

const DROPI_PRODUCT_IDS = [1689694, 1173076];
const DROPI_BASE_URL = process.env.DROPI_BASE_URL ?? 'https://api.dropi.co/v1';
const DROPI_API_KEY = process.env.DROPI_API_KEY ?? '';

const headers = {
  Authorization: `Bearer ${DROPI_API_KEY}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5433),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? '1234',
  database: process.env.DB_NAME ?? 'proshop',
  entities: [Product, ProductVariant, User, Order, OrderItem, Payment],
  synchronize: false,
});

// Intentar varios patrones de endpoint hasta que uno funcione
async function fetchDropiProduct(id: number): Promise<any | null> {
  const candidates = [
    `${DROPI_BASE_URL}/products/${id}`,
    `https://api.dropi.co/integrations/products/${id}`,
    `https://api.dropi.co/integrations/products/show/${id}`,
    `https://api.dropi.co/woocommerce/products/${id}`,
    `https://api.dropi.co/v1/integrations/products/${id}`,
  ];

  for (const url of candidates) {
    try {
      const { data } = await axios.get(url, { headers, timeout: 12000 });
      // Dropi puede devolver { isSuccess, objects: [...] } o el objeto directo
      const product = data?.objects?.[0] ?? (data?.isSuccess ? null : data);
      if (product && (product.id || product.name)) {
        console.log(`  Encontrado en: ${url}`);
        return product;
      }
      if (data?.isSuccess === true && data?.objects?.length > 0) {
        return data.objects[0];
      }
    } catch (e: any) {
      // 404 esperado — seguir intentando
    }
  }
  return null;
}

// Buscar en la lista de productos (paginando) cuando el endpoint por ID no funciona
async function searchInProductList(dropiId: number): Promise<any | null> {
  const listEndpoints = [
    `https://api.dropi.co/integrations/products`,
    `https://api.dropi.co/v1/products`,
    `https://api.dropi.co/woocommerce/products`,
  ];

  for (const base of listEndpoints) {
    for (let page = 1; page <= 5; page++) {
      try {
        const { data } = await axios.get(`${base}?page=${page}&limit=50`, { headers, timeout: 12000 });
        const items: any[] = data?.objects ?? data?.data ?? data?.products ?? (Array.isArray(data) ? data : []);
        if (!items.length) break;
        const found = items.find((p: any) => Number(p.id) === dropiId);
        if (found) {
          console.log(`  Encontrado en lista: ${base} pagina ${page}`);
          return found;
        }
        // Si vino menos de 50, no hay mas paginas
        if (items.length < 50) break;
      } catch { break; }
    }
  }
  return null;
}

function mapCategories(raw: any): string[] {
  const cats: string[] = [];
  if (raw?.categories) cats.push(...(Array.isArray(raw.categories) ? raw.categories.map((c: any) => c?.name ?? c) : []));
  if (raw?.tags) cats.push(...(Array.isArray(raw.tags) ? raw.tags.map((t: any) => t?.name ?? t) : []));
  if (raw?.category) cats.push(String(raw.category));
  return normalizeCategories(cats.length > 0 ? [cats.join(' ')] : null);
}

function extractImages(raw: any): string[] {
  const images: string[] = [];
  const gallery = raw?.gallery ?? raw?.images ?? raw?.pictures ?? raw?.photos ?? [];
  if (Array.isArray(gallery)) {
    for (const img of gallery) {
      const url = img?.src ?? img?.url ?? img?.path ?? img?.image ?? (typeof img === 'string' ? img : null);
      if (url && !images.includes(url)) images.push(url);
    }
  }
  const main = raw?.image ?? raw?.thumbnail ?? raw?.photo ?? raw?.main_image;
  if (main && !images.includes(main)) images.unshift(main);
  return images.filter(Boolean);
}

async function importProducts(): Promise<void> {
  await dataSource.initialize();
  console.log('Conectado a la BD\n');

  const productRepo = dataSource.getRepository(Product);
  const variantRepo = dataSource.getRepository(ProductVariant);

  for (const dropiId of DROPI_PRODUCT_IDS) {
    console.log(`\nBuscando producto Dropi #${dropiId}...`);

    let raw = await fetchDropiProduct(dropiId);

    if (!raw) {
      console.log('  No encontrado por ID — buscando en lista de productos...');
      raw = await searchInProductList(dropiId);
    }

    if (!raw) {
      console.log(`  NO encontrado. Crea el producto manualmente desde el Admin Panel.\n`);
      continue;
    }

    const name = raw?.name ?? raw?.title ?? raw?.product_name ?? `Producto Dropi ${dropiId}`;
    const description = (raw?.description ?? raw?.body_html ?? raw?.short_description ?? '').replace(/<[^>]*>/g, '');
    const suggestedPrice = Number(raw?.suggested_price ?? raw?.retail_price ?? raw?.price_suggested ?? 0);
    const providerPrice = Number(raw?.provider_price ?? raw?.price ?? raw?.cost ?? raw?.compare_at_price ?? 0);
    const price = suggestedPrice || providerPrice || 0;
    const images = extractImages(raw);
    const imageUrl = images[0] ?? null;
    const categories = mapCategories(raw);
    const stock = Number(raw?.stock ?? raw?.inventory_quantity ?? raw?.quantity ?? raw?.available ?? 10);

    console.log(`  Nombre: ${name}`);
    console.log(`  Precio: $${price.toLocaleString('es-CO')}`);
    console.log(`  Imagen: ${imageUrl ?? '(sin imagen)'}`);
    console.log(`  Imagen extra: ${images[1] ?? '—'}`);
    console.log(`  Categorias: ${categories.join(', ')}`);
    console.log(`  Stock: ${stock}`);
    console.log(`  Descripcion: ${description.slice(0, 100)}...`);

    const existing = await productRepo.findOne({ where: { dropiProductId: dropiId } });

    if (existing) {
      console.log(`  Actualizando producto local #${existing.id}...`);
      await productRepo.update(existing.id, {
        name,
        description: description.slice(0, 5000) || undefined,
        price,
        imageUrl: imageUrl ?? undefined,
        dropiProductId: dropiId,
      });
      console.log(`  Actualizado.`);
      continue;
    }

    const product = productRepo.create({
      name,
      description: description.slice(0, 5000) || undefined,
      price,
      categories,
      gender: ['U'],
      rating: 0,
      reviews: 0,
      imageUrl: imageUrl ?? undefined,
      dropiProductId: dropiId,
    });
    const saved = await productRepo.save(product);

    const variant = variantRepo.create({ color: 'U', size: 'U', available: stock });
    variant.productId = saved.id;
    await variantRepo.save(variant);

    console.log(`  Creado como producto local #${saved.id}`);
  }

  await dataSource.destroy();
  console.log('\nImportacion completada.');
}

importProducts().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
