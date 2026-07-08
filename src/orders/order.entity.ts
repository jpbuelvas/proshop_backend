import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { OrderItem } from './order-item.entity';

export type OrderStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'SHIPPED';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true, eager: true })
  items: OrderItem[];

  @Column({ type: 'enum', enum: ['PENDING', 'APPROVED', 'DECLINED', 'SHIPPED'], default: 'PENDING' })
  status: OrderStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number;

  @Column({ nullable: true })
  shippingAddress: string;

  @Column({ nullable: true })
  shippingCity: string;

  @Column({ nullable: true })
  shippingPhone: string;

  @Column({ nullable: true })
  dropiOrderId: string;

  @Column({ nullable: true })
  trackingNumber: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
