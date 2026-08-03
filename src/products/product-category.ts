export const PRODUCT_CATEGORIES = ['ropa', 'accesorios', 'equipos', 'outlet'] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

const CATEGORY_SET: readonly string[] = PRODUCT_CATEGORIES;

// Categorias legadas (calzado, belleza, general, otro, sinonimos externos de
// Dropi/WooCommerce) se consolidan en 'equipos' salvo que matcheen ropa/accesorios/outlet.
function mapLegacyCategory(raw: string): ProductCategory {
  if (raw.includes('ropa') || raw.includes('clothing')) return 'ropa';
  if (raw.includes('accesorio') || raw.includes('accessory')) return 'accesorios';
  if (raw.includes('outlet') || raw.includes('sale') || raw.includes('oferta')) return 'outlet';
  return 'equipos';
}

export function normalizeCategories(raw: string[] | string | null | undefined): ProductCategory[] {
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const mapped = list
    .map((c) => String(c).trim().toLowerCase())
    .filter(Boolean)
    .map((c) => (CATEGORY_SET.includes(c) ? (c as ProductCategory) : mapLegacyCategory(c)));
  const unique = [...new Set(mapped)];
  return unique.length > 0 ? unique : ['equipos'];
}
