import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Order, OrderStatus } from './order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { ProductsService } from '../products/products.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly productsService: ProductsService,
  ) {}

  async create(userId: number, dto: CreateOrderDto): Promise<Order> {
    // Reservar stock atómicamente — lanza BadRequestException si no hay disponibles
    await this.productsService.reserveStock(
      dto.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    );

    const order = this.orderRepo.create({
      userId,
      status: 'PENDING',
      total: dto.total,
      shippingAddress: dto.shippingAddress,
      shippingCity: dto.shippingCity,
      shippingPhone: dto.shippingPhone,
      items: dto.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        size: i.size ?? null,
        color: i.color ?? null,
      })) as any,
    });
    return this.orderRepo.save(order);
  }

  findAllByUser(userId: number): Promise<Order[]> {
    return this.orderRepo.find({
      where: { userId },
      relations: ['items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOneByUser(id: number, userId: number): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['items', 'items.product'],
    });
    if (!order) throw new NotFoundException('Orden no encontrada');
    if (order.userId !== userId) throw new ForbiddenException('No autorizado');
    return order;
  }

  async findOneWithUser(id: number): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['items', 'items.product', 'user'],
    });
    if (!order) throw new NotFoundException(`Orden #${id} no encontrada`);
    return order;
  }

  async updateStatus(id: number, status: OrderStatus): Promise<void> {
    await this.orderRepo.update(id, { status });
  }

  async setTracking(
    orderId: number,
    dropiOrderId: string,
    trackingNumber: string,
  ): Promise<void> {
    await this.orderRepo.update(orderId, {
      dropiOrderId,
      trackingNumber,
      status: 'SHIPPED',
    });
  }

  // Libera el stock de una orden (para usar desde controllers/webhooks)
  async releaseStockForOrder(order: Order): Promise<void> {
    if (!order.items?.length) return;
    await this.productsService.releaseStock(
      order.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    );
  }

  // Busca órdenes PENDING más antiguas que `cutoff` (para limpiar reservas expiradas)
  findExpiredPending(cutoff: Date): Promise<Order[]> {
    return this.orderRepo.find({
      where: { status: 'PENDING', createdAt: LessThan(cutoff) },
      relations: ['items'],
    });
  }

  // Cancela la orden y libera el stock reservado
  async cancelExpired(order: Order): Promise<void> {
    await this.orderRepo.update(order.id, { status: 'DECLINED' });
    await this.productsService.releaseStock(
      order.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    );
  }
}
