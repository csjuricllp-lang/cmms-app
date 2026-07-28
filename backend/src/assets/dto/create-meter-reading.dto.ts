import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateMeterReadingDto {
  @IsNumber()
  value: number;

  @IsString()
  @IsOptional()
  notes?: string; // Optional technician note e.g. 'reading after full 8-hour shift'
}
