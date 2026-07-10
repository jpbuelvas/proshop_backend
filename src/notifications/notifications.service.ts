import { Injectable, Logger } from '@nestjs/common';
import { Order } from '../orders/order.entity';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
  ) {}

  async sendOrderConfirmation(order: Order): Promise<void> {
    const results = await Promise.allSettled([
      this.emailService.sendOrderConfirmation(order),
      this.smsService.sendOrderConfirmation(order),
    ]);
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        this.logger.error(`Notificacion [${i}] fallo: ${r.reason}`);
      }
    });
  }

  async sendShippingUpdate(order: Order): Promise<void> {
    const results = await Promise.allSettled([
      this.emailService.sendShippingUpdate(order),
      this.smsService.sendShippingUpdate(order),
    ]);
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        this.logger.error(`Notificacion envio [${i}] fallo: ${r.reason}`);
      }
    });
  }
}
