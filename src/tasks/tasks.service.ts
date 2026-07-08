import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrdersService } from '../orders/orders.service';

const RESERVATION_MINUTES = 10; // minutos antes de cancelar una orden PENDING

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly ordersService: OrdersService) {}

  // Ejecuta cada minuto: cancela órdenes PENDING > 10 min y libera su stock
  @Cron(CronExpression.EVERY_MINUTE)
  async cleanupExpiredReservations() {
    const cutoff = new Date(Date.now() - RESERVATION_MINUTES * 60 * 1000);

    const expired = await this.ordersService.findExpiredPending(cutoff);
    if (!expired.length) return;

    this.logger.log(`Limpiando ${expired.length} órdenes expiradas...`);

    for (const order of expired) {
      await this.ordersService.cancelExpired(order);
      this.logger.log(`Orden #${order.id} cancelada — stock liberado`);
    }
  }
}
