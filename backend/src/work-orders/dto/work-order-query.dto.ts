import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class WorkOrderQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  maintenanceType?: string;

  @IsOptional()
  @IsString()
  assetId?: string;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsString()
  assignedTeamId?: string;

  @IsOptional()
  @IsString()
  isShared?: string;

  @IsOptional()
  @IsString()
  isBookmarked?: string;

  @IsOptional()
  @IsString()
  isRepeating?: string;

  @IsOptional()
  @IsString()
  pmScheduleId?: string;

  @IsOptional()
  @IsString()
  dueDateStart?: string;

  @IsOptional()
  @IsString()
  dueDateEnd?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  /** 'true' = has startDate AND assignedToId (scheduled), 'false' = missing either (unscheduled) */
  @IsOptional()
  @IsString()
  isScheduled?: string;

  /** Filter WOs whose startDate >= this ISO datetime */
  @IsOptional()
  @IsString()
  startDateStart?: string;

  /** Filter WOs whose startDate <= this ISO datetime */
  @IsOptional()
  @IsString()
  startDateEnd?: string;

  /** Filter by exact category (case-insensitive) */
  @IsOptional()
  @IsString()
  category?: string;
}
