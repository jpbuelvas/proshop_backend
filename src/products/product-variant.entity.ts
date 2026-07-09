import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('product_variants')
@Unique(['productId', 'color', 'size']) // una fila por (producto, color, talla)
export class ProductVariant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  productId: number;

  @ManyToOne(() => Product, (p) => p.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  // 'U' = sin variante de color (producto en un solo color)
  @Column({ length: 50, default: 'U' })
  color: string;

  // 'U' = talla única (producto sin selección de talla, ej: mochila, tapete)
  @Column({ length: 20, default: 'U' })
  size: string;

  // Stock disponible para esta combinación color+talla
  @Column({ type: 'int', default: 0 })
  available: number;

  // Precio especial para esta variante (NULL = usa el precio base del producto)
  // Útil para promociones por color específico sin crear un nuevo producto
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, default: null })
  specialPrice: number;

  // Imagen específica de este color (NULL = usa la imagen principal del producto)
  @Column({ length: 500, nullable: true })
  imageUrl: string;
}
