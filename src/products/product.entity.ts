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

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ length: 50 })
  color: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio: number;

  @Column({ length: 50 })
  categoria: string;

  @Column({ type: 'text', array: true, nullable: true })
  tallas: string[];

  @Column({ type: 'int', default: 0 })
  disponibles: number;

  @Column({ length: 500, nullable: true })
  urlImagen: string;
}
