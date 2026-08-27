import { Controller, Get, Post, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { SyncService } from './sync.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import axios from 'axios';
import * as https from 'https';

// En producción SIEMPRE se valida el certificado TLS. Solo en desarrollo se
// acepta un certificado self-signed para probar contra WooCommerce en local.
const httpsAgent = new https.Agent({
  rejectUnauthorized: process.env.NODE_ENV === 'production',
});

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getStatus() {
    return this.syncService.getStatus();
  }

  @Get('test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async test() {
    const wcUrl = process.env.WC_URL ?? 'https://dropi-bridge.local';
    const wcKey = process.env.WC_CONSUMER_KEY ?? '';
    const wcSecret = process.env.WC_CONSUMER_SECRET ?? '';
    const auth = Buffer.from(`${wcKey}:${wcSecret}`).toString('base64');
    try {
      const res = await axios.get(`${wcUrl}/wp-json/wc/v3/products`, {
        headers: { Authorization: `Basic ${auth}` },
        params: { per_page: 5, status: 'any' },
        timeout: 10000,
        httpsAgent,
      });
      const products = (res.data ?? []).map((p: any) => {
        const meta: Record<string, any> = {};
        (p.meta_data ?? []).forEach((m: any) => { meta[m.key] = m.value; });
        let dropiJson: any = null;
        try { dropiJson = JSON.parse(meta['_dropi_product'] ?? 'null'); } catch {}
        return {
          id: p.id,
          name: p.name,
          status: p.status,
          price: p.price,
          regular_price: p.regular_price,
          description: (p.description ?? '').slice(0, 200),
          images: (p.images ?? []).map((i: any) => i.src),
          categories: (p.categories ?? []).map((c: any) => c.name),
          stock_quantity: p.stock_quantity,
          dropi_product_id: meta['_dropi_product_id'],
          dropi_json_keys: dropiJson ? Object.keys(dropiJson) : null,
          dropi_precio_sugerido: dropiJson?.precio_sugerido ?? dropiJson?.suggested_price ?? null,
          dropi_descripcion: String(dropiJson?.descripcion ?? dropiJson?.description ?? '').slice(0, 200) || null,
          dropi_imagen: dropiJson?.imagenes?.[0]?.url ?? dropiJson?.images?.[0]?.url ?? dropiJson?.imagen ?? null,
        };
      });
      return { ok: true, status: res.status, count: products.length, products };
    } catch (e: any) {
      return { ok: false, error: e.message, status: e?.response?.status, data: e?.response?.data, wcUrl };
    }
  }

  @Post('products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.ACCEPTED)
  async triggerSync() {
    this.syncService.syncAll().catch((e) => console.error('Sync error:', e.message));
    return { message: 'Sync iniciado. Consulta GET /sync/status para ver el progreso.' };
  }
}
