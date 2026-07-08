import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Payment, PaymentStatus } from './payment.entity';
import { Order } from '../orders/order.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly config: ConfigService,
  ) {}

  // Genera referencia única por orden
  generateReference(orderId: number): string {
    return `PROSHOP-${orderId}-${Date.now()}`;
  }

  // Firma integrity requerida por Wompi para el widget
  generateIntegritySignature(
    reference: string,
    amountInCents: number,
    currency: string,
  ): string {
    const secret = this.config.get<string>('WOMPI_INTEGRITY_SECRET')!;
    const raw = `${reference}${amountInCents}${currency}${secret}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  // Inicia un pago: crea el registro PENDING y devuelve datos para el widget
  async initPayment(order: Order): Promise<{
    reference: string;
    publicKey: string;
    amountInCents: number;
    currency: string;
    signature: string;
  }> {
    const reference = this.generateReference(order.id);
    const amountInCents = Math.round(Number(order.total) * 100);
    const currency = 'COP';
    const signature = this.generateIntegritySignature(reference, amountInCents, currency);

    const payment = this.paymentRepo.create({
      orderId: order.id,
      wompiReference: reference,
      status: 'PENDING',
      amountInCents,
      currency,
    });
    await this.paymentRepo.save(payment);

    return {
      reference,
      publicKey: this.config.get<string>('WOMPI_PUBLIC_KEY')!,
      amountInCents,
      currency,
      signature,
    };
  }

  // Consulta Wompi directamente y actualiza el pago si está pendiente
  async verifyFromWompi(transactionId: string): Promise<{
    wompiStatus: string;
    payment: Payment | null;
    newStatus: PaymentStatus | null;
  }> {
    const privateKey = this.config.get<string>('WOMPI_PRIVATE_KEY')!;
    const baseUrl = privateKey.startsWith('prv_test_')
      ? 'https://sandbox.wompi.co/v1'
      : 'https://production.wompi.co/v1';

    const res = await fetch(`${baseUrl}/transactions/${transactionId}`, {
      headers: { Authorization: `Bearer ${privateKey}` },
    });

    if (!res.ok) throw new NotFoundException(`Transacción ${transactionId} no encontrada en Wompi`);

    const body = await res.json() as any;
    const transaction = body.data;

    const payment = await this.findByReference(transaction.reference);
    if (!payment) throw new NotFoundException(`Pago no encontrado para referencia: ${transaction.reference}`);

    const statusMap: Record<string, PaymentStatus> = {
      APPROVED: 'APPROVED',
      DECLINED: 'DECLINED',
      VOIDED: 'VOIDED',
      ERROR: 'DECLINED',
    };

    const newStatus = statusMap[transaction.status] ?? null;

    if (newStatus && payment.status === 'PENDING') {
      await this.updateStatus(payment, newStatus, String(transaction.id), transaction);
      payment.status = newStatus;
    }

    return { wompiStatus: transaction.status, payment, newStatus };
  }

  findByReference(reference: string): Promise<Payment | null> {
    return this.paymentRepo.findOne({ where: { wompiReference: reference } });
  }

  async findByOrderId(orderId: number): Promise<Payment | null> {
    return this.paymentRepo.findOne({ where: { orderId } });
  }

  async updateStatus(
    payment: Payment,
    status: PaymentStatus,
    transactionId: string,
    rawResponse: object,
  ): Promise<Payment> {
    payment.status = status;
    payment.wompiTransactionId = transactionId;
    payment.rawResponse = rawResponse;
    return this.paymentRepo.save(payment);
  }
}
