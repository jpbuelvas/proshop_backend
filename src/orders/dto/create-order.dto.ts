import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';

export class OrderItemDto {
  @IsNumber()
  productId: number;

  @IsNumber()
  @IsPositive()
  quantity: number;

  // Informativo únicamente: el precio real se recalcula en el servidor
  // (OrdersService.create) a partir del producto/variante en BD.
  @IsNumber()
  @IsPositive()
  @IsOptional()
  unitPrice?: number;

  @IsString()
  @IsOptional()
  size?: string;

  @IsString()
  @IsOptional()
  color?: string;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  // Informativo únicamente: el total real se recalcula en el servidor
  // sumando los unitPrice recalculados (ver OrdersService.create).
  @IsNumber()
  @IsPositive()
  @IsOptional()
  total?: number;

  @IsString()
  shippingAddress: string;

  @IsString()
  shippingCity: string;

  @IsString()
  shippingPhone: string;
}
