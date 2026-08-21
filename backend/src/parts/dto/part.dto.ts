import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { InventoryTransactionType } from '@prisma/client';

export class CreatePartDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  partNumber?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  tags?: string;

  @IsString()
  @IsOptional()
  manufacturer?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  quantity?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  minQuantity?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  maxQuantity?: number;

  @IsNumber()
  @IsOptional()
  cost?: number;

  @IsString()
  @IsOptional()
  locationId?: string;

  @IsString()
  @IsOptional()
  binLocation?: string;

  @IsString()
  @IsOptional()
  criticality?: string;

  @IsString()
  @IsOptional()
  vendorId?: string;

  @IsString()
  @IsOptional()
  teamId?: string;

  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  assignedToId?: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsBoolean()
  @IsOptional()
  autoReorderEnabled?: boolean;
}

export class UpdatePartDto extends PartialType(CreatePartDto) {}

export class AdjustStockDto {
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsEnum(InventoryTransactionType)
  @IsNotEmpty()
  type: InventoryTransactionType;

  @IsString()
  @IsOptional()
  referenceId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class AddInventoryLineDto {
  @IsString()
  @IsNotEmpty()
  locationId: string;

  @IsInt()
  @Min(0)
  availableQty: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  minQty?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  maxQty?: number;

  @IsNumber()
  @IsOptional()
  cost?: number;

  @IsString()
  @IsOptional()
  area?: string;

  @IsString()
  @IsOptional()
  barcode?: string;
}

export class UpdateInventoryLineDto extends PartialType(AddInventoryLineDto) {}
