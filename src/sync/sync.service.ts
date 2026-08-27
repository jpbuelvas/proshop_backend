import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import * as https from 'https';
import { Product } from '../products/product.entity';
import { ProductVariant } from '../products/product-variant.entity';
import { normalizeCategories } from '../products/product-category';

interface WcImage { src: string; }
interface WcCategory { name: string; }
interface WcMeta { key: string; value: any; }
interface WcProduct {
  id: number;
  name: string;
  description: string;
  short_description: string;
  price: string;
  regular_price: string;
  stock_quantity: number | null;
  categories: WcCategory[];
  images: WcImage[];
  meta_data: WcMeta[];
  status: string;
}

export interface SyncLogEntry {
  name: string;
  action: 'creado' | 'actualizado';
  price: number;
  categories: string[];
  imageUrl: string;
  ts: number;
}

function stripHtml(html: string): string {
  return (html ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function getMeta(meta: WcMeta[], ...keys: string[]): string | null {
  for (const key of keys) {
    const found = meta.find((m) => m.key === key);
    if (found?.value != null) return String(found.value);
  }
  return null;
}

// En producción SIEMPRE se valida el certificado TLS. Solo en desarrollo se
// acepta un certificado self-signed (Local by Flywheel) para probar contra
// WooCommerce en local.
const httpsAgent = new https.Agent({
  rejectUnauthorized: process.env.NODE_ENV === 'production',
});

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private lastSync: Date | null = null;
  private lastCount = 0;
  private lastErrors = 0;
  private syncing = false;
  private recentLog: SyncLogEntry[] = [];

  private get wcBase() { return process.env.WC_URL ?? 'https://dropi-bridge.local'; }
  private get wcKey() { return process.env.WC_CONSUMER_KEY ?? ''; }
  private get wcSecret() { return process.env.WC_CONSUMER_SECRET ?? ''; }

  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(ProductVariant) private variantRepo: Repository<ProductVariant>,
  ) {}

  getStatus() {
    return {
      lastSync: this.lastSync,
      lastCount: this.lastCount,
      lastErrors: this.lastErrors,
      syncing: this.syncing,
      recentLog: this.recentLog,
    };
  }

  @Cron('0 */6 * * *')
  async scheduledSync() {
    this.logger.log('Scheduled sync started');
    await this.syncAll();
  }

  async syncAll(): Promise<{ synced: number; errors: number }> {
    if (this.syncing) return { synced: 0, errors: 0 };
    this.syncing = true;
    this.recentLog = [];
    let synced = 0;
    let errors = 0;
    let page = 1;
    const perPage = 100;

    try {
      while (true) {
        const products = await this.fetchPage(page, perPage);
        if (!products || products.length === 0) break;

        for (const p of products) {
          try {
            const entry = await this.upsertProduct(p);
            this.recentLog.unshift(entry);
            if (this.recentLog.length > 200) this.recentLog.pop();
            synced++;
          } catch (e: any) {
            errors++;
            this.logger.warn(`Error WC#${p.id} "${p.name}": ${e.message}`);
          }
        }

        this.logger.log(`Pagina ${page}: ${products.length} productos (total: ${synced})`);
        if (products.length < perPage) break;
        page++;
      }
    } catch (e: any) {
      this.logger.error(`Error en sync: ${e.message}`);
      throw e;
    } finally {
      this.syncing = false;
      this.lastSync = new Date();
      this.lastCount = synced;
      this.lastErrors = errors;
    }

    return { synced, errors };
  }

  private async fetchPage(page: number, perPage: number): Promise<WcProduct[]> {
    const auth = Buffer.from(`${this.wcKey}:${this.wcSecret}`).toString('base64');
    const { data } = await axios.get<WcProduct[]>(
      `${this.wcBase}/wp-json/wc/v3/products`,
      {
        headers: { Authorization: `Basic ${auth}` },
        params: { per_page: perPage, page, status: 'any' },
        timeout: 30000,
        httpsAgent,
      },
    );
    return data;
  }

  private async upsertProduct(wc: WcProduct): Promise<SyncLogEntry> {
    const dropiIdRaw = getMeta(wc.meta_data, '_dropi_product_id', 'dropi_product_id', '_dropi_id');
    const dropiProductId = dropiIdRaw ? parseInt(dropiIdRaw, 10) : null;

    // Extraer JSON completo del producto Dropi del meta _dropi_product
    let dropiJson: any = null;
    const dropiProductRaw = getMeta(wc.meta_data, '_dropi_product');
    if (dropiProductRaw) {
      try { dropiJson = JSON.parse(dropiProductRaw); } catch {}
    }

    const suggestedRaw = getMeta(wc.meta_data, '_precio_sugerido', 'precio_sugerido', '_suggested_price', 'suggested_price')
      ?? String(dropiJson?.precio_sugerido ?? dropiJson?.suggested_price ?? '');
    const suggested = suggestedRaw ? parseFloat(suggestedRaw) : null;
    const dropiCost = parseFloat(wc.regular_price || wc.price || '0');

    const price = suggested && suggested > 0 ? suggested : dropiCost;
    const previousPrice = suggested && suggested > 0 ? dropiCost : null;

    const name = wc.name.trim();
    // Descripcion: WC > _dropi_product JSON > short_description
    const rawDesc = wc.description || dropiJson?.descripcion || dropiJson?.description || wc.short_description || '';
    const description = stripHtml(rawDesc);
    const categories = normalizeCategories(wc.categories?.[0]?.name ?? dropiJson?.categoria ?? null);
    // Imagen: WC images > _dropi_product imagenes
    const imageUrl = wc.images?.[0]?.src
      ?? dropiJson?.imagenes?.[0]?.url
      ?? dropiJson?.images?.[0]?.url
      ?? dropiJson?.imagen
      ?? '';
    const stock = wc.stock_quantity ?? dropiJson?.stock ?? 0;

    let existing: Product | null = null;
    if (dropiProductId) {
      existing = await this.productRepo.findOne({ where: { dropiProductId } });
    }
    if (!existing) {
      existing = await this.productRepo.findOne({ where: { name } });
    }

    let action: 'creado' | 'actualizado';

    if (existing) {
      action = 'actualizado';
      existing.name = name;
      existing.description = description;
      existing.price = price;
      (existing as any).previousPrice = previousPrice;
      existing.categories = categories;
      if (imageUrl) existing.imageUrl = imageUrl;
      if (dropiProductId && !existing.dropiProductId) existing.dropiProductId = dropiProductId;
      await this.productRepo.save(existing);

      const v = await this.variantRepo.findOne({
        where: { productId: existing.id, color: 'U', size: 'U' },
      });
      if (v) {
        v.available = stock;
        await this.variantRepo.save(v);
      }
    } else {
      action = 'creado';
      const product = new Product();
      product.name = name;
      product.description = description;
      product.price = price;
      (product as any).previousPrice = previousPrice;
      product.categories = categories;
      product.gender = ['hombre', 'mujer'];
      product.imageUrl = imageUrl;
      product.reviews = 0;
      if (dropiProductId) product.dropiProductId = dropiProductId;

      const saved = await this.productRepo.save(product);

      const variant = new ProductVariant();
      variant.color = 'U';
      variant.size = 'U';
      variant.available = stock;
      variant.productId = saved.id;
      await this.variantRepo.save(variant);
    }

    return { name, action, price, categories, imageUrl, ts: Date.now() };
  }
}
