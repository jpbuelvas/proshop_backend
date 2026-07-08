import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, default: null })
  precioAnterior: number;

  @Column({ length: 50 })
  categoria: string;

  @Column({ type: 'text', array: true, nullable: true })
  genero: string[];

  @Column({ type: 'text', array: true, nullable: true })
  tallas: string[];

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true, default: null })
  rating: number;

  @Column({ type: 'int', nullable: true, default: 0 })
  reviews: number;

  @Column({ type: 'int', default: 100 })
  disponibles: number;

  @Column({ length: 500, nullable: true })
  urlImagen: string;
}
