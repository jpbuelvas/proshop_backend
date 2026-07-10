import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import { Order } from '../orders/order.entity';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private client: Twilio | null = null;

  constructor(private readonly config: ConfigService) {
    const sid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const token = this.config.get<string>('TWILIO_AUTH_TOKEN');
    if (sid && token) {
      this.client = new Twilio(sid, token);
    } else {
      this.logger.warn('Twilio no configurado - SMS deshabilitado');
    }
  }

  async sendOrderConfirmation(order: Order): Promise<void> {
    const phone = order.user?.phone || order.shippingPhone;
    if (!phone || !this.client) return;

    const from = this.config.get<string>('TWILIO_PHONE_FROM');
    const body = `Proshop: Pago aprobado! Pedido #${order.id} por $${Number(order.total).toLocaleString('es-CO')}. Te avisamos cuando sea enviado.`;

    try {
      await this.client.messages.create({ from, to: phone, body });
      this.logger.log(`SMS de confirmacion enviado a ${phone} (orden #${order.id})`);
    } catch (err) {
      this.logger.error(`Error enviando SMS de confirmacion: ${(err as Error).message}`);
    }
  }

  async sendShippingUpdate(order: Order): Promise<void> {
    const phone = order.user?.phone || order.shippingPhone;
    if (!phone || !this.client) return;

    const from = this.config.get<string>('TWILIO_PHONE_FROM');
    const tracking = order.trackingNumber
      ? ` Guia: ${order.trackingNumber}.`
      : '';
    const body = `Proshop: Tu pedido #${order.id} fue enviado.${tracking}`;

    try {
      await this.client.messages.create({ from, to: phone, body });
      this.logger.log(`SMS de envio enviado a ${phone} (orden #${order.id})`);
    } catch (err) {
      this.logger.error(`Error enviando SMS de envio: ${(err as Error).message}`);
    }
  }
}
