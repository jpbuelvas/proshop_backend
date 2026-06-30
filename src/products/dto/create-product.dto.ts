import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  Min,
  MaxLength,
  IsPositive,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MaxLength(100)
  nombre: string;

  @IsString()
  descripcion: string;

  @IsString()
  @MaxLength(50)
  color: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  precio: number;

  @IsString()
  @MaxLength(50)
  categoria: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tallas?: string[];

  @IsNumber()
  @Min(0)
  disponibles: number;

  @IsString()
  @IsOptional()
  urlImagen?: string;
}
