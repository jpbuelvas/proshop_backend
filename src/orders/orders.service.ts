import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { DataSource, LessThan, Repository } from 'typeorm';
import { Order, OrderStatus } from './order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { ProductsService } from '../products/products.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly productsService: ProductsService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async create(userId: number, dto: CreateOrderDto): Promise<Order> {
    const lookupItems = dto.items.map((i) => ({
      productId: i.productId,
      color: i.color || 'U',
      size: i.size || 'U',
      quantity: i.quantity,
    }));

    // El precio y el total SIEMPRE se recalculan en el servidor a partir del
    // producto/variante en BD — nunca se confía en el unitPrice/total que
    // manda el cliente (evita manipulación de precio desde el navegador).
    const pricedItems = await this.productsService.getPricedItems(lookupItems);
    const total = pricedItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

    // Reserva de stock + creación de la orden en una sola transacción: si
    // guardar la orden falla, la reserva de stock se revierte también.
    return this.dataSource.transaction(async (manager) => {
      await this.productsService.reserveStock(lookupItems, manager);

      const orderRepo = manager.getRepository(Order);
      const order = orderRepo.create({
        userId,
        status: 'PENDING',
        total,
        shippingAddress: dto.shippingAddress,
        shippingCity: dto.shippingCity,
        shippingPhone: dto.shippingPhone,
        items: dto.items.map((i, idx) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: pricedItems[idx].unitPrice,
          size: i.size ?? null,
          color: i.color ?? null,
        })) as any,
      });
      return orderRepo.save(order);
    });
  }

  findAllByUser(userId: number): Promise<Order[]> {
    return this.orderRepo.find({
      where: { userId },
      relations: ['items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  findAllForAdmin(): Promise<Order[]> {
    return this.orderRepo.find({
      relations: ['items', 'items.product', 'user'],
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
    if (!order) throw new NotFoundException('Orden #' + id + ' no encontrada');
    return order;
  }

  async updateStatus(id: number, status: OrderStatus): Promise<void> {
    await this.orderRepo.update(id, { status });
  }

  async setTracking(orderId: number, dropiOrderId: string, trackingNumber: string): Promise<void> {
    await this.orderRepo.update(orderId, { dropiOrderId, trackingNumber, status: 'SHIPPED' });
  }

  async releaseStockForOrder(order: Order): Promise<void> {
    if (!order.items?.length) return;
    await this.productsService.releaseStock(
      order.items.map((i) => ({
        productId: i.productId,
        color: i.color || 'U',
        size: i.size || 'U',
        quantity: i.quantity,
      })),
    );
  }

  findExpiredPending(cutoff: Date): Promise<Order[]> {
    return this.orderRepo.find({
      where: { status: 'PENDING', createdAt: LessThan(cutoff) },
      relations: ['items'],
    });
  }

  async cancelExpired(order: Order): Promise<void> {
    await this.orderRepo.update(order.id, { status: 'DECLINED' });
    await this.productsService.releaseStock(
      order.items.map((i) => ({
        productId: i.productId,
        color: i.color || 'U',
        size: i.size || 'U',
        quantity: i.quantity,
      })),
    );
  }
}
