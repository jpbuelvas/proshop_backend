/**
 * Migracion puntual: category (string) -> categories (text[]).
 * Corre UNA vez, antes de reiniciar el backend con la entidad Product ya sin `category`:
 *   npx ts-node -r tsconfig-paths/register src/seeds/migrate-categories.ts
 *
 * Usa SQL crudo (no la entidad TypeORM) para funcionar tanto si la columna
 * `category` todavia existe como si `categories` ya fue agregada por un run anterior.
 */
import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { DataSource } from 'typeorm';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const VALID = ['ropa', 'accesorios', 'equipos', 'outlet'];

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME || 'proshop',
  synchronize: false,
});

async function main() {
  await AppDataSource.initialize();
  console.log('Conectado a PostgreSQL');

  await AppDataSource.query(
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS categories text[]`,
  );

  const rows: { id: number; category: string | null }[] = await AppDataSource.query(
    `SELECT id, category FROM products WHERE categories IS NULL`,
  );

  console.log(`Backfilling ${rows.length} producto(s)...`);

  for (const row of rows) {
    const raw = (row.category ?? '').trim().toLowerCase();
    const mapped = VALID.includes(raw) ? raw : 'equipos';
    await AppDataSource.query(
      `UPDATE products SET categories = ARRAY[$1]::text[] WHERE id = $2`,
      [mapped, row.id],
    );
    console.log(`  #${row.id}: "${row.category}" -> [${mapped}]`);
  }

  await AppDataSource.query(
    `UPDATE products SET categories = ARRAY['equipos']::text[] WHERE categories IS NULL`,
  );
  await AppDataSource.query(
    `ALTER TABLE products ALTER COLUMN categories SET NOT NULL`,
  );

  console.log('Listo. La columna `category` vieja se elimina sola al reiniciar el backend (synchronize).');
  await AppDataSource.destroy();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
