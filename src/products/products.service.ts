import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { ProductVariant } from './product-variant.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

function variantFields(v: {
  color?: string;
  size?: string;
  available?: number;
  specialPrice?: number;
  imageUrl?: string;
}) {
  return {
    color: v.color ?? 'U',
    size: v.size ?? 'U',
    available: v.available ?? 0,
    ...(v.specialPrice != null ? { specialPrice: v.specialPrice } : {}),
    ...(v.imageUrl ? { imageUrl: v.imageUrl } : {}),
  };
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
  ) {}

  async create(dto: CreateProductDto): Promise<Product> {
    const { variants, ...productData } = dto;
    const product = this.productRepository.create(productData);
    const saved = await this.productRepository.save(product);

    if (variants && variants.length > 0) {
      const variantEntities: ProductVariant[] = variants.map((v) => {
        const entity = this.variantRepository.create(variantFields(v));
        entity.productId = saved.id;
        return entity;
      });
      await this.variantRepository.save(variantEntities);
    }

    return this.findOne(saved.id);
  }

  findAll(): Promise<Product[]> {
    return this.productRepository.find();
  }

  findByCategory(category: string): Promise<Product[]> {
    return this.productRepository
      .createQueryBuilder('product')
      .where(':category = ANY(product.categories)', { category })
      .getMany();
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOneBy({ id });
    if (!product) throw new NotFoundException(`Producto #${id} no encontrado`);
    return product;
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    const { variants, ...productData } = dto;
    Object.assign(product, productData);
    await this.productRepository.save(product);

    if (variants !== undefined) {
      const incomingIds = variants.filter((v) => v.id).map((v) => v.id!);
      const existingVariants = await this.variantRepository.find({ where: { productId: id } });
      const toDelete = existingVariants.filter((ev) => !incomingIds.includes(ev.id));
      if (toDelete.length > 0) await this.variantRepository.remove(toDelete);

      for (const v of variants) {
        if (v.id) {
          await this.variantRepository.update(v.id, variantFields(v));
        } else {
          const entity = this.variantRepository.create(variantFields(v));
          entity.productId = id;
          await this.variantRepository.save(entity);
        }
      }
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }

  async checkStock(
    items: { productId: number; color: string; size: string; quantity: number }[],
  ): Promise<{ productId: number; productName: string; available: number; requested: number }[]> {
    const issues: { productId: number; productName: string; available: number; requested: number }[] = [];
    for (const item of items) {
      const variant = await this.variantRepository.findOne({
        where: { productId: item.productId, color: item.color, size: item.size },
        relations: ['product'],
      });
      const available = variant?.available ?? 0;
      if (available < item.quantity) {
        const productName =
          variant?.product?.name ??
          (await this.productRepository.findOne({ where: { id: item.productId } }))?.name ??
          `producto #${item.productId}`;
        issues.push({ productId: item.productId, productName, available, requested: item.quantity });
      }
    }
    return issues;
  }

  async reserveStock(
    items: { productId: number; color: string; size: string; quantity: number }[],
  ): Promise<void> {
    for (const item of items) {
      const result = await this.variantRepository
        .createQueryBuilder()
        .update(ProductVariant)
        .set({ available: () => `available - ${item.quantity}` })
        .where(
          '"productId" = :pid AND color = :color AND size = :size AND available >= :qty',
          { pid: item.productId, color: item.color, size: item.size, qty: item.quantity },
        )
        .execute();

      if (!result.affected || result.affected === 0) {
        const variant = await this.variantRepository.findOne({
          where: { productId: item.productId, color: item.color, size: item.size },
          relations: ['product'],
        });
        const productName =
          variant?.product?.name ??
          (await this.productRepository.findOne({ where: { id: item.productId } }))?.name ??
          `producto #${item.productId}`;
        const available = variant?.available ?? 0;
        const detail =
          item.color !== 'U' && item.size !== 'U'
            ? `color ${item.color}, talla ${item.size}`
            : item.color !== 'U'
            ? `color ${item.color}`
            : item.size !== 'U'
            ? `talla ${item.size}`
            : '';
        throw new BadRequestException(
          `Stock insuficiente para "${productName}"${detail ? ' (' + detail + ')' : ''} - disponibles: ${available}`,
        );
      }
    }
  }

  async releaseStock(
    items: { productId: number; color: string; size: string; quantity: number }[],
  ): Promise<void> {
    for (const item of items) {
      await this.variantRepository
        .createQueryBuilder()
        .update(ProductVariant)
        .set({ available: () => `available + ${item.quantity}` })
        .where('"productId" = :pid AND color = :color AND size = :size', {
          pid: item.productId,
          color: item.color,
          size: item.size,
        })
        .execute();
    }
  }
}
