import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Order } from '../orders/order.entity';

export interface DropiOrderResult {
  dropiOrderId: string;
  trackingNumber: string | null;
}

@Injectable()
export class DropiService {
  private readonly logger = new Logger(DropiService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = config.get<string>('DROPI_BASE_URL', 'https://api.dropi.co/v1');
    this.apiKey = config.get<string>('DROPI_API_KEY', '');
  }

  async createOrder(order: Order): Promise<DropiOrderResult> {
    if (!this.apiKey) {
      this.logger.warn('DROPI_API_KEY no configurada — orden no creada en Dropi');
      return { dropiOrderId: '', trackingNumber: null };
    }

    const payload = {
      external_reference: `PROSHOP-${order.id}`,
      customer: {
        name: order.user?.name ?? 'Cliente',
        email: order.user?.email ?? '',
        phone: order.shippingPhone ?? '',
      },
      shipping_address: {
        address: order.shippingAddress ?? '',
        city: order.shippingCity ?? '',
        country: 'CO',
      },
      items: (order.items ?? []).map((item) => ({
        // dropiProductId en la entidad Product (puede ser null para productos locales)
        product_id: (item as any).product?.dropiProductId ?? item.productId,
        quantity: item.quantity,
        ...(item.size && item.size !== 'U' ? { size: item.size } : {}),
        ...(item.color && item.color !== 'U' ? { color: item.color } : {}),
      })),
    };

    try {
      const { data } = await axios.post(
        `${this.baseUrl}/orders`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      const dropiOrderId = String(data?.id ?? data?.order_id ?? '');
      const trackingNumber = data?.guide_number ?? data?.tracking_number ?? null;

      this.logger.log(`Orden Dropi creada: ${dropiOrderId} para orden local #${order.id}`);
      return { dropiOrderId, trackingNumber };
    } catch (err: any) {
      // No lanzamos el error para no bloquear el flujo de pago
      this.logger.error(
        `Error creando orden en Dropi para orden #${order.id}: ${err?.response?.data ? JSON.stringify(err.response.data) : err.message}`,
      );
      return { dropiOrderId: '', trackingNumber: null };
    }
  }

  // Obtener datos de un producto de Dropi por su ID
  async getProduct(dropiProductId: number): Promise<any> {
    const { data } = await axios.get(
      `${this.baseUrl}/products/${dropiProductId}`,
      {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        timeout: 10000,
      },
    );
    return data;
  }
}
