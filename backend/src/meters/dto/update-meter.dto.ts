import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';

export class UpdateMeterDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsString()
  @IsOptional()
  assetId?: string;

  @IsNumber()
  @IsOptional()
  threshold?: number;

  @IsBoolean()
  @IsOptional()
  triggerPM?: boolean;

  @IsNumber()
  @IsOptional()
  frequency?: number;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  assignedToId?: string;

  @IsString()
  @IsOptional()
  locationId?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  organizationId?: string;
}
