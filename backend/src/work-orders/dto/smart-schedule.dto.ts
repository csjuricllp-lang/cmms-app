import { IsArray, IsOptional, IsString, IsISO8601 } from 'class-validator';

export class SmartScheduleDto {
  @IsOptional()
  @IsISO8601()
  date?: string;

  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @IsOptional()
  @IsString()
  shiftId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  technicianIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  workOrderIds?: string[];
}
