import { IsString, IsOptional, IsBoolean, IsInt, IsEnum, IsNumber, IsUUID } from 'class-validator';
import { Priority, FrequencyType, PMScheduleStatus } from '@prisma/client';

export class CreatePMScheduleDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  woTitle?: string;

  @IsString()
  @IsOptional()
  woDescription?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @IsOptional()
  advanceNoticeDays?: number;

  @IsUUID()
  assetId: string;

  @IsUUID()
  @IsOptional()
  checklistId?: string;

  @IsUUID()
  @IsOptional()
  assignedToId?: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @IsEnum(FrequencyType)
  @IsOptional()
  frequencyType?: FrequencyType;

  @IsInt()
  @IsOptional()
  frequencyValue?: number;

  @IsBoolean()
  @IsOptional()
  isFloating?: boolean;

  @IsUUID()
  @IsOptional()
  meterId?: string;

  @IsNumber()
  @IsOptional()
  meterInterval?: number;

  @IsEnum(PMScheduleStatus)
  @IsOptional()
  status?: PMScheduleStatus;
}
