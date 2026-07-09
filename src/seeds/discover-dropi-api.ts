import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';

const KEY = process.env.DROPI_API_KEY ?? '';
const BASE = 'https://api.dropi.co';
const H = { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Accept: 'application/json' };

async function req(method: string, url: string, body?: any) {
  try {
    const r = await axios({ method, url, headers: H, data: body, timeout: 12000 });
    console.log(`  OK ${r.status}: ${JSON.stringify(r.data).slice(0, 500)}`);
    return r.data;
  } catch (e: any) {
    const s = e?.response?.status ?? 'ERR';
    const m = JSON.stringify(e?.response?.data ?? e.message).slice(0, 300);
    console.log(`  ${s}: ${m}`);
    return null;
  }
}

async function main() {
  console.log('=== POST /integrations/products (sync product to integration) ===');
  await req('POST', `${BASE}/integrations/products`, { product_id: 1689694 });
  console.log();
  await req('POST', `${BASE}/integrations/products`, { id: 1689694 });
  console.log();

  console.log('=== POST /integrations/products/favorites ===');
  await req('POST', `${BASE}/integrations/products/favorites`);
  console.log();

  console.log('=== POST /integrations/products con body vacio ===');
  await req('POST', `${BASE}/integrations/products`, {});
  console.log();

  console.log('=== GET /integrations/orders (estructura de ordenes) ===');
  await req('GET', `${BASE}/integrations/orders`);
  console.log();

  console.log('=== POST /integrations/orders (estructura esperada) ===');
  await req('POST', `${BASE}/integrations/orders`, {
    external_reference: 'TEST-1',
    customer: { name: 'Test', email: 'test@test.com', phone: '3001234567' },
    shipping_address: { address: 'Calle 123', city: 'Bogota', country: 'CO' },
    items: [{ product_id: 1689694, quantity: 1 }]
  });
  console.log();

  // Intentar sin /v1/ prefix
  console.log('=== GET /integrations/product/1689694 (sin s) ===');
  await req('GET', `${BASE}/integrations/product/1689694`);
  console.log();

  console.log('=== POST /integrations/product ===');
  await req('POST', `${BASE}/integrations/product`, { id: 1689694 });
  console.log();
}

main();
