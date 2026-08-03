import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  outletDiscountPercent?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  freeShippingThreshold?: number | null;
}
