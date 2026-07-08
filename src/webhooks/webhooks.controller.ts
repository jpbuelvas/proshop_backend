import {
  Controller,
  Post,
  Body,
  Headers,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  // POST /webhooks/wompi — receptor de eventos de Wompi
  // Wompi envía esta petición cuando una transacción cambia de estado
  @Post('wompi')
  @HttpCode(HttpStatus.OK)
  async wompiWebhook(
    @Body() body: any,
    @Headers('x-event-checksum') checksum: string,
  ) {
    this.logger.log(`Webhook Wompi recibido: ${body?.event}`);

    // 1. Validar firma — NUNCA procesar sin verificar
    const isValid = this.webhooksService.validateWompiSignature(body, checksum);
    if (!isValid) {
      this.logger.warn('Firma Wompi inválida — petición rechazada');
      throw new BadRequestException('Invalid signature');
    }

    // 2. Solo procesar eventos de transacciones
    if (body?.event === 'transaction.updated') {
      await this.webhooksService.handleTransactionUpdated(body?.data?.transaction);
    }

    return { received: true };
  }
}
