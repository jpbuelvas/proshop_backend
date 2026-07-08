import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(createProductDto);
    return this.productRepository.save(product);
  }

  findAll(): Promise<Product[]> {
    return this.productRepository.find();
  }

  findByCategory(categoria: string): Promise<Product[]> {
    return this.productRepository.find({ where: { categoria } });
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOneBy({ id });
    if (!product) throw new NotFoundException(`Producto #${id} no encontrado`);
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, updateProductDto);
    return this.productRepository.save(product);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }

  // Decrementa stock atómicamente. Lanza error si no hay suficiente.
  async reserveStock(items: { productId: number; quantity: number }[]): Promise<void> {
    for (const item of items) {
      const result = await this.productRepository
        .createQueryBuilder()
        .update(Product)
        .set({ disponibles: () => `disponibles - ${item.quantity}` })
        .where('id = :id AND disponibles >= :qty', { id: item.productId, qty: item.quantity })
        .execute();

      if (!result.affected || result.affected === 0) {
        const p = await this.productRepository.findOneBy({ id: item.productId });
        throw new BadRequestException(
          `Stock insuficiente para "${p?.nombre ?? `producto #${item.productId}`}" — disponibles: ${p?.disponibles ?? 0}`,
        );
      }
    }
  }

  // Devuelve stock (al cancelar/rechazar orden)
  async releaseStock(items: { productId: number; quantity: number }[]): Promise<void> {
    for (const item of items) {
      await this.productRepository
        .createQueryBuilder()
        .update(Product)
        .set({ disponibles: () => `disponibles + ${item.quantity}` })
        .where('id = :id', { id: item.productId })
        .execute();
    }
  }
}
