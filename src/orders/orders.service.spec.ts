import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ForbiddenException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { ProductsService } from '../products/products.service';
import { Order } from './order.entity';
import { CreateOrderDto } from './dto/create-order.dto';

describe('OrdersService', () => {
  let service: OrdersService;
  let productsService: { getPricedItems: jest.Mock; reserveStock: jest.Mock };
  let orderRepo: { create: jest.Mock; save: jest.Mock; findOne: jest.Mock };
  let dataSource: { transaction: jest.Mock };

  const shippingFields = {
    shippingAddress: 'Calle 1',
    shippingCity: 'Bogotá',
    shippingPhone: '3000000000',
  };

  beforeEach(async () => {
    orderRepo = {
      create: jest.fn((data) => data),
      save: jest.fn((order) => Promise.resolve({ id: 1, ...order })),
      findOne: jest.fn(),
    };
    productsService = { getPricedItems: jest.fn(), reserveStock: jest.fn() };
    dataSource = {
      transaction: jest.fn((cb) => cb({ getRepository: jest.fn().mockReturnValue(orderRepo) })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: orderRepo },
        { provide: ProductsService, useValue: productsService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(OrdersService);
  });

  describe('create', () => {
    it('ignora el unitPrice/total enviados por el cliente y usa el precio recalculado en el servidor', async () => {
      productsService.getPricedItems.mockResolvedValue([
        { productId: 1, color: 'U', size: 'U', quantity: 2, unitPrice: 10000 },
      ]);

      const dto: CreateOrderDto = {
        items: [{ productId: 1, quantity: 2, unitPrice: 1 }],
        total: 1, // precio manipulado desde el navegador
        ...shippingFields,
      } as CreateOrderDto;

      const order: any = await service.create(7, dto);

      expect(order.total).toBe(20000); // 2 * 10000 recalculado, no el "1" del cliente
      expect(order.items[0].unitPrice).toBe(10000);
    });

    it('reserva el stock dentro de la misma transacción que crea la orden', async () => {
      productsService.getPricedItems.mockResolvedValue([
        { productId: 1, color: 'U', size: 'U', quantity: 1, unitPrice: 5000 },
      ]);

      const dto: CreateOrderDto = {
        items: [{ productId: 1, quantity: 1 }],
        ...shippingFields,
      } as CreateOrderDto;

      await service.create(7, dto);

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      expect(productsService.reserveStock).toHaveBeenCalledWith(
        [{ productId: 1, color: 'U', size: 'U', quantity: 1 }],
        expect.anything(), // el EntityManager transaccional
      );
    });
  });

  describe('findOneByUser', () => {
    it('lanza ForbiddenException si la orden no pertenece al usuario que la pide', async () => {
      orderRepo.findOne.mockResolvedValue({ id: 1, userId: 99 });

      await expect(service.findOneByUser(1, 7)).rejects.toThrow(ForbiddenException);
    });

    it('devuelve la orden si pertenece al usuario', async () => {
      orderRepo.findOne.mockResolvedValue({ id: 1, userId: 7 });

      await expect(service.findOneByUser(1, 7)).resolves.toEqual({ id: 1, userId: 7 });
    });
  });
});
