import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Product } from './products/product.entity';
import { ProductVariant } from './products/product-variant.entity';
import { User } from './users/user.entity';
import { Order } from './orders/order.entity';
import { OrderItem } from './orders/order-item.entity';
import { Payment } from './payments/payment.entity';
import { SiteSettings } from './settings/site-settings.entity';

// DataSource independiente para el CLI de TypeORM (migration:generate/run/revert).
// No lo usa la app en runtime (eso lo maneja AppModule vía TypeOrmModule.forRootAsync);
// existe solo para que el CLI pueda conectarse a la BD y generar/aplicar migraciones,
// que son obligatorias ahora que `synchronize` está apagado en producción.
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'proshop',
  entities: [Product, ProductVariant, User, Order, OrderItem, Payment, SiteSettings],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
});

export default AppDataSource;
