import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { OrdersService } from '../orders/orders.service';
import type { OrderStatus } from '../orders/order.entity';
import { IsNumber } from 'class-validator';

class InitPaymentDto {
  @IsNumber()
  orderId: number;
}

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly ordersService: OrdersService,
  ) {}

  // POST /payments/init — obtener datos para lanzar el widget de Wompi
  @Post('init')
  @UseGuards(JwtAuthGuard)
  async initPayment(@Req() req: any, @Body() body: InitPaymentDto) {
    const order = await this.ordersService.findOneByUser(body.orderId, req.user.id);
    return this.paymentsService.initPayment(order);
  }

  // GET /payments/verify/:transactionId — verificar estado directamente en Wompi
  @Get('verify/:transactionId')
  @UseGuards(JwtAuthGuard)
  async verifyTransaction(@Param('transactionId') transactionId: string) {
    const result = await this.paymentsService.verifyFromWompi(transactionId);

    if (result.newStatus && result.payment) {
      const orderStatus: OrderStatus =
        result.newStatus === 'APPROVED' ? 'APPROVED' : 'DECLINED';
      await this.ordersService.updateStatus(result.payment.orderId, orderStatus);

      // Si fue rechazado, liberar el stock reservado
      if (orderStatus === 'DECLINED') {
        const order = await this.ordersService.findOneWithUser(result.payment.orderId);
        await this.ordersService.releaseStockForOrder(order);
      }
    }

    return {
      transactionStatus: result.wompiStatus,
      orderId: result.payment?.orderId ?? null,
      updated: !!result.newStatus,
    };
  }
}
