import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type PaymentStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'VOIDED';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  orderId: number;

  @Column({ unique: true })
  wompiReference: string;

  @Column({ nullable: true })
  wompiTransactionId: string;

  @Column({
    type: 'enum',
    enum: ['PENDING', 'APPROVED', 'DECLINED', 'VOIDED'],
    default: 'PENDING',
  })
  status: PaymentStatus;

  @Column({ type: 'bigint' })
  amountInCents: number;

  @Column({ default: 'COP' })
  currency: string;

  @Column({ type: 'jsonb', nullable: true })
  rawResponse: object;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
