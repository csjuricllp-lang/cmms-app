import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddChecklistResponseDto {
  @IsString()
  @IsNotEmpty()
  checklistItemId: string;

  @IsString()
  @IsOptional()
  responseValue?: string; // Text input, number stored as string, or 'true'/'false'

  @IsBoolean()
  @IsOptional()
  passed?: boolean; // For PASS_FAIL types

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  photoUrl?: string;

  @IsString()
  @IsOptional()
  url?: string;
}
