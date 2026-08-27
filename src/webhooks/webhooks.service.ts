import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PaymentsService } from '../payments/payments.service';
import { OrdersService } from '../orders/orders.service';
import { DropiService } from '../dropi/dropi.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly paymentsService: PaymentsService,
    private readonly ordersService: OrdersService,
    private readonly dropiService: DropiService,
    private readonly notificationsService: NotificationsService,
  ) {}

  validateWompiSignature(body: any, checksum: string): boolean {
    try {
      const secret = this.config.get<string>('WOMPI_EVENTS_SECRET')!;
      const properties: string[] = body?.signature?.properties ?? [];
      const timestamp: string = String(body?.timestamp ?? '');
      const data = body?.data;

      // Las rutas de signature.properties (ej. "transaction.id") se resuelven
      // contra "data", no contra la raíz del payload — así lo documenta Wompi.
      const concatenated =
        properties
          .map((prop: string) =>
            prop.split('.').reduce((acc: any, key: string) => acc?.[key], data),
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
      this.logger.warn('Pago no encontrado para referencia: ' + reference);
      return;
    }

    const statusMap: Record<string, 'APPROVED' | 'DECLINED' | 'VOIDED'> = {
      APPROVED: 'APPROVED',
      DECLINED: 'DECLINED',
      VOIDED: 'VOIDED',
      ERROR: 'DECLINED',
    };

    const newStatus = statusMap[wompiStatus];
    if (!newStatus) {
      this.logger.log('Estado Wompi ignorado: ' + wompiStatus);
      return;
    }

    await this.paymentsService.updateStatus(payment, newStatus, transactionId, transaction);

    const orderStatus = newStatus === 'APPROVED' ? 'APPROVED' : 'DECLINED';
    await this.ordersService.updateStatus(payment.orderId, orderStatus);

    if (orderStatus === 'DECLINED') {
      const order = await this.ordersService.findOneWithUser(payment.orderId);
      await this.ordersService.releaseStockForOrder(order);
    }

    if (orderStatus === 'APPROVED') {
      const order = await this.ordersService.findOneWithUser(payment.orderId);

      // Crear orden en Dropi (no bloquea el flujo si falla)
      const dropiResult = await this.dropiService.createOrder(order);

      if (dropiResult.dropiOrderId) {
        await this.ordersService.setTracking(
          payment.orderId,
          dropiResult.dropiOrderId,
          dropiResult.trackingNumber ?? '',
        );
        this.logger.log(
          'Orden #' + payment.orderId + ' => Dropi #' + dropiResult.dropiOrderId,
        );
      }

      // Recargar orden con tracking actualizado antes de notificar
      const orderFinal = await this.ordersService.findOneWithUser(payment.orderId);
      await this.notificationsService.sendOrderConfirmation(orderFinal);
    }

    this.logger.log(
      'Orden #' + payment.orderId + ' => ' + orderStatus + ' (ref: ' + reference + ')',
    );
  }
}
