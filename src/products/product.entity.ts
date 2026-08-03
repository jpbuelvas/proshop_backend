import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { ProductVariant } from './product-variant.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, default: null })
  previousPrice: number;

  @Column({ type: 'text', array: true })
  categories: string[];

  @Column({ type: 'text', array: true, nullable: true })
  gender: string[];

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true, default: null })
  rating: number;

  @Column({ type: 'int', nullable: true, default: 0 })
  reviews: number;

  @Column({ length: 500, nullable: true })
  imageUrl: string;

  // ID del producto en Dropi (para crear ordenes de envio)
  @Column({ nullable: true, type: 'int' })
  dropiProductId: number;

  // Stock por color+talla
  @OneToMany(() => ProductVariant, (v) => v.product, { eager: true, cascade: true })
  variants: ProductVariant[];
}
