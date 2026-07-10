import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { Product } from '../products/product.entity';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product]), OrdersModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, EmailService, SmsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
