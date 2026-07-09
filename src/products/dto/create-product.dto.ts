import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  MaxLength,
  IsPositive,
  ValidateNested,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVariantDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  size?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  available?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  specialPrice?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class CreateProductDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  previousPrice?: number;

  @IsString()
  @MaxLength(50)
  category: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  gender?: string[];

  @IsNumber({ maxDecimalPlaces: 1 })
  @IsOptional()
  rating?: number;

  @IsNumber()
  @IsOptional()
  reviews?: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants?: CreateVariantDto[];
}
