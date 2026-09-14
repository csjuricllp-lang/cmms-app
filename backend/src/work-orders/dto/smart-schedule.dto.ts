import { IsArray, IsOptional, IsString, IsISO8601, ArrayMaxSize, ArrayUnique } from 'class-validator';

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
  @ArrayMaxSize(500, { message: 'Maximum of 500 technicians allowed per schedule request to prevent DoS.' })
  @ArrayUnique({ message: 'Duplicate Technician IDs are not allowed.' })
  @IsString({ each: true })
  technicianIds?: string[];

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500, { message: 'Maximum of 500 Work Orders allowed per schedule request to prevent DoS.' })
  @ArrayUnique({ message: 'Duplicate Work Order IDs are not allowed.' })
  @IsString({ each: true })
  workOrderIds?: string[];
}
