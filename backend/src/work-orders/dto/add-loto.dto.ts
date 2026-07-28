import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class AddLOTODto {
  @IsNumber()
  @IsOptional()
  locksApplied?: number;

  @IsNumber()
  @IsOptional()
  tagsApplied?: number;

  @IsBoolean()
  @IsOptional()
  energyIsolated?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}
