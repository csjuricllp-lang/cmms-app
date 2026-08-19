import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  IsNumber,
  IsBoolean,
} from 'class-validator';

export enum FrequencyType {
  DAYS = 'DAYS',
  WEEKS = 'WEEKS',
  MONTHS = 'MONTHS',
  YEARS = 'YEARS',
  METER = 'METER',
  HYBRID = 'HYBRID',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  NONE = 'NONE',
}

export enum PMScheduleStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
}

export class CreatePMScheduleDto {
  @IsString()
  @IsNotEmpty()
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

  @IsString()
  @IsNotEmpty()
  assetId: string;

  @IsString()
  @IsOptional()
  checklistId?: string;

  @IsString()
  @IsOptional()
  assignedToId?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @IsNumber()
  @IsOptional()
  durationHours?: number;

  @IsBoolean()
  @IsOptional()
  requiresSignature?: boolean;

  @IsEnum(FrequencyType)
  @IsNotEmpty()
  frequencyType: FrequencyType;

  @IsInt()
  @Min(1)
  @IsOptional()
  frequencyValue?: number;

  @IsDateString()
  @IsOptional()
  nextDueDate?: string;

  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @IsOptional()
  advanceNoticeDays?: number;

  @IsOptional()
  isFloating?: boolean;

  @IsOptional()
  isSeasonal?: boolean;

  @IsInt()
  @IsOptional()
  startMonth?: number;

  @IsInt()
  @IsOptional()
  endMonth?: number;

  @IsString()
  @IsOptional()
  meterId?: string;

  @IsInt()
  @IsOptional()
  meterInterval?: number;

  @IsOptional()
  plannedParts?: { partId: string; quantity: number }[];

  @IsOptional()
  plannedTasks?: { task: string; order: number }[];

  @IsString()
  @IsOptional()
  dueDateTime?: string;

  @IsString()
  @IsOptional()
  createWOType?: string;

  @IsInt()
  @IsOptional()
  meterWODueValue?: number;

  @IsString()
  @IsOptional()
  meterWODueUnit?: string;

  @IsString()
  @IsOptional()
  meterTriggerType?: string;

  @IsOptional()
  assets?: {
    assetId: string;
    locationId?: string;
    meterId?: string;
    startDate?: string;
    assignedToId?: string;
  }[];

  @IsOptional()
  inactivePeriods?: { startDate: string; endDate: string; reason?: string }[];

  @IsBoolean()
  @IsOptional()
  createNow?: boolean;

  @IsEnum(PMScheduleStatus)
  @IsOptional()
  status?: PMScheduleStatus;
}

export class UpdatePMScheduleDto {
  @IsString()
  @IsOptional()
  name?: string;

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

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @IsNumber()
  @IsOptional()
  durationHours?: number;

  @IsBoolean()
  @IsOptional()
  requiresSignature?: boolean;

  @IsEnum(FrequencyType)
  @IsOptional()
  frequencyType?: FrequencyType;

  @IsInt()
  @Min(1)
  @IsOptional()
  frequencyValue?: number;

  @IsDateString()
  @IsOptional()
  nextDueDate?: string;

  @IsString()
  @IsOptional()
  assignedToId?: string;

  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @IsOptional()
  advanceNoticeDays?: number;

  @IsOptional()
  isFloating?: boolean;

  @IsOptional()
  isSeasonal?: boolean;

  @IsInt()
  @IsOptional()
  startMonth?: number;

  @IsInt()
  @IsOptional()
  endMonth?: number;

  @IsString()
  @IsOptional()
  meterId?: string;

  @IsInt()
  @IsOptional()
  meterInterval?: number;

  @IsString()
  @IsOptional()
  dueDateTime?: string;

  @IsString()
  @IsOptional()
  createWOType?: string;

  @IsInt()
  @IsOptional()
  meterWODueValue?: number;

  @IsString()
  @IsOptional()
  meterWODueUnit?: string;

  @IsOptional()
  inactivePeriods?: { startDate: string; endDate: string; reason?: string }[];

  @IsBoolean()
  @IsOptional()
  createNow?: boolean;

  @IsEnum(PMScheduleStatus)
  @IsOptional()
  status?: PMScheduleStatus;

  @IsOptional()
  plannedParts?: { partId: string; quantity: number }[];

  @IsOptional()
  plannedTasks?: { task: string; order: number }[];
}
