import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  IsDateString,
  IsObject,
  IsInt,
  IsArray,
} from 'class-validator';

export class CreateAssetDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsIn([
    'OPERATIONAL',
    'DOWN',
    'MAINTENANCE',
    'STANDBY',
    'DECOMMISSIONED',
    'DISPOSED',
  ])
  @IsOptional()
  status?: string;

  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  @IsOptional()
  criticality?: string;

  // Manufacturing / Identity
  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsString()
  @IsOptional()
  serialNumber?: string;

  @IsString()
  @IsOptional()
  qrCode?: string;

  @IsString()
  @IsOptional()
  barCode?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  // Financial Tracking (INR/USD)
  @IsNumber()
  @IsOptional()
  purchasePrice?: number;

  @IsNumber()
  @IsOptional()
  replacementCost?: number;

  @IsNumber()
  @IsOptional()
  residualValue?: number;

  @IsDateString()
  @IsOptional()
  purchaseDate?: string;

  @IsDateString()
  @IsOptional()
  warrantyExpiry?: string;

  @IsDateString()
  @IsOptional()
  placedInServiceDate?: string;

  @IsInt()
  @IsOptional()
  expectedLifeYears?: number;

  // Hierarchy & Assignment
  @IsString()
  @IsOptional()
  parentAssetId?: string;

  @IsString()
  @IsOptional()
  assignedToId?: string;

  @IsString()
  @IsOptional()
  teamId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  additionalWorkerIds?: string[];

  // Flexible Data
  @IsObject()
  @IsOptional()
  specifications?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  isMobile?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsNotEmpty()
  locationId: string;
}
