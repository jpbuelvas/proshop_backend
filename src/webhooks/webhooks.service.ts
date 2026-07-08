import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PaymentsService } from '../payments/payments.service';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly paymentsService: PaymentsService,
    private readonly ordersService: OrdersService,
  ) {}

  // Valida la firma que Wompi envía en el header x-event-checksum
  validateWompiSignature(body: any, checksum: string): boolean {
    try {
      const secret = this.config.get<string>('WOMPI_EVENTS_SECRET')!;
      const properties: string[] = body?.signature?.properties ?? [];
      const timestamp: string = String(body?.timestamp ?? '');

      // Concatenar valores de las propiedades indicadas por Wompi + timestamp + secret
      const concatenated =
        properties
          .map((prop: string) =>
            prop.split('.').reduce((acc: any, key: string) => acc?.[key], body),
          )
          .join('') +
        timestamp +
        secret;

      const hash = crypto.createHash('sha256').update(concatenated).digest('hex');
      return hash === checksum;
    } catch {
      return false;
    }
  }

  async handleTransactionUpdated(transaction: any): Promise<void> {
    const reference: string = transaction?.reference;
    const transactionId: string = String(transaction?.id ?? '');
    const wompiStatus: string = transaction?.status;

    if (!reference || !wompiStatus) {
      this.logger.warn('Webhook sin reference o status, ignorando');
      return;
    }

    const payment = await this.paymentsService.findByReference(reference);
    if (!payment) {
      this.logger.warn(`Pago no encontrado para referencia: ${reference}`);
      return;
    }

    // Mapear estado de Wompi a estado interno
    const statusMap: Record<string, 'APPROVED' | 'DECLINED' | 'VOIDED'> = {
      APPROVED: 'APPROVED',
      DECLINED: 'DECLINED',
      VOIDED: 'VOIDED',
      ERROR: 'DECLINED',
    };

    const newStatus = statusMap[wompiStatus];
    if (!newStatus) {
      this.logger.log(`Estado Wompi ignorado: ${wompiStatus}`);
      return;
    }

    // Actualizar pago
    await this.paymentsService.updateStatus(payment, newStatus, transactionId, transaction);

    // Actualizar orden y gestionar stock
    const orderStatus = newStatus === 'APPROVED' ? 'APPROVED' : 'DECLINED';
    await this.ordersService.updateStatus(payment.orderId, orderStatus);

    // Si fue rechazado, liberar el stock reservado
    if (orderStatus === 'DECLINED') {
      const order = await this.ordersService.findOneWithUser(payment.orderId);
      await this.ordersService.releaseStockForOrder(order);
    }

    this.logger.log(
      `Orden #${payment.orderId} → ${orderStatus} (Wompi ref: ${reference})`,
    );

    // TODO Fase siguiente: si APPROVED → crear orden en Dropi + enviar notificaciones
  }
}
