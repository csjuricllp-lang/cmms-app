import { IsOptional, IsString, IsEnum, IsDateString, IsBoolean } from 'class-validator';
import { Priority } from '@prisma/client';

export class ApproveRequestDto {
  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsEnum(Priority) // Medium Fix: Require strict priority matching
  @IsOptional()
  priority?: Priority;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsString()
  assignedTeamId?: string;

  @IsOptional()
  @IsString()
  checklistId?: string;

  @IsOptional()
  @IsString()
  estimatedHours?: string;

  @IsOptional()
  @IsBoolean()
  signatureRequired?: boolean;
}
