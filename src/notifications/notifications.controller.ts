import { Body, Controller, Post, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { IsEmail, IsNumber, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { EmailService } from './email.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/product.entity';
import { OrdersService } from '../orders/orders.service';
import { Order } from '../orders/order.entity';

class SendProductNotificationDto {
  @IsEmail()
  toEmail: string;
  @IsString()
  toName: string;
  @IsNumber()
  productId: number;
  @IsOptional()
  @IsString()
  message?: string;
}

class SendOrderMessageDto {
  @IsNumber()
  orderId: number;
  @IsString()
  subject: string;
  @IsString()
  message: string;
}

class SendSupportMessageDto {
  @IsString()
  fromName: string;
  @IsEmail()
  fromEmail: string;
  @IsString()
  messageText: string;
  @IsOptional()
  @IsNumber()
  orderId?: number;
}

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly emailService: EmailService,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly ordersService: OrdersService,
  ) {}

  @Post('product')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async sendProductNotification(@Body() dto: SendProductNotificationDto) {
    const product = await this.productRepo.findOne({ where: { id: dto.productId } });
    if (!product) return { success: false, message: 'Producto no encontrado' };
    await this.emailService.sendProductNotification({
      toEmail: dto.toEmail,
      toName: dto.toName,
      product: { name: product.name, price: product.price, imageUrl: product.imageUrl, description: product.description },
      message: dto.message,
    });
    return { success: true, message: 'Email enviado a ' + dto.toEmail };
  }

  @Post('order')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async sendOrderMessage(@Body() dto: SendOrderMessageDto) {
    const order = await this.ordersService.findOneWithUser(dto.orderId);
    const toEmail = order.user?.email;
    const toName = order.user?.name ?? 'Cliente';
    if (!toEmail) return { success: false, message: 'El cliente no tiene email' };
    await this.emailService.sendOrderMessage({ toEmail, toName, orderId: dto.orderId, subject: dto.subject, message: dto.message });
    return { success: true, message: 'Email enviado a ' + toEmail };
  }

  @Post('contact')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async sendSupportMessage(@Body() dto: SendSupportMessageDto) {
    let order: Order | undefined;
    if (dto.orderId) {
      try {
        order = await this.ordersService.findOneWithUser(dto.orderId);
      } catch (_e) {
        order = undefined;
      }
    }
    await this.emailService.sendSupportMessage({
      fromName: dto.fromName,
      fromEmail: dto.fromEmail,
      message: dto.messageText,
      orderId: dto.orderId,
      order,
    });
    return { success: true, message: 'Mensaje enviado al equipo de soporte' };
  }
}
