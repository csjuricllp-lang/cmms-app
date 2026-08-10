import { IsString, IsEnum, IsOptional, IsDateString, IsObject, IsUUID } from 'class-validator';
import { PermitType } from '@prisma/client';

export class CreatePermitDto {
  @IsEnum(PermitType)
  type: PermitType;

  @IsOptional()
  @IsUUID()
  workOrderId?: string;

  @IsOptional()
  @IsUUID()
  assetId?: string;

  @IsOptional()
  @IsUUID()
  locationId?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsObject()
  riskAssessment?: any;

  @IsOptional()
  @IsObject()
  ppeChecklist?: any;

  @IsOptional()
  @IsObject()
  lotoChecklist?: any;
}
