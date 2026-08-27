import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './product.entity';
import { ProductVariant } from './product-variant.entity';

function mockQueryBuilder(executeResult: { affected: number }) {
  const qb: any = {};
  qb.update = jest.fn().mockReturnValue(qb);
  qb.set = jest.fn().mockReturnValue(qb);
  qb.where = jest.fn().mockReturnValue(qb);
  qb.execute = jest.fn().mockResolvedValue(executeResult);
  return qb;
}

describe('ProductsService', () => {
  let service: ProductsService;
  let variantRepo: any;
  let productRepo: any;

  beforeEach(async () => {
    variantRepo = { findOne: jest.fn(), createQueryBuilder: jest.fn() };
    productRepo = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: productRepo },
        { provide: getRepositoryToken(ProductVariant), useValue: variantRepo },
      ],
    }).compile();

    service = module.get(ProductsService);
  });

  describe('reserveStock', () => {
    it('descuenta el stock cuando el UPDATE afecta una fila (había disponibilidad)', async () => {
      variantRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder({ affected: 1 }));

      await expect(
        service.reserveStock([{ productId: 1, color: 'U', size: 'U', quantity: 2 }]),
      ).resolves.toBeUndefined();
    });

    it('lanza BadRequestException si el UPDATE afecta 0 filas (stock insuficiente)', async () => {
      variantRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder({ affected: 0 }));
      variantRepo.findOne.mockResolvedValue({ available: 1, product: { name: 'Camiseta' } });

      await expect(
        service.reserveStock([{ productId: 1, color: 'Rojo', size: 'M', quantity: 5 }]),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPricedItems', () => {
    it('usa el specialPrice de la variante cuando existe', async () => {
      variantRepo.findOne.mockResolvedValue({ specialPrice: '50000', product: { price: '80000' } });

      const [item] = await service.getPricedItems([
        { productId: 1, color: 'U', size: 'U', quantity: 1 },
      ]);

      expect(item.unitPrice).toBe(50000);
    });

    it('usa el precio base del producto cuando la variante no tiene specialPrice', async () => {
      variantRepo.findOne.mockResolvedValue({ specialPrice: null, product: { price: '80000' } });

      const [item] = await service.getPricedItems([
        { productId: 1, color: 'U', size: 'U', quantity: 1 },
      ]);

      expect(item.unitPrice).toBe(80000);
    });

    it('lanza NotFoundException si la variante no existe (evita comprar productos inexistentes)', async () => {
      variantRepo.findOne.mockResolvedValue(null);

      await expect(
        service.getPricedItems([{ productId: 999, color: 'U', size: 'U', quantity: 1 }]),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
