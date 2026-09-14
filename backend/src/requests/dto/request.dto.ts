import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { Priority } from '@prisma/client';

export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  CANCELLED = 'CANCELLED',
}

export class CreateRequestDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  assetId?: string;

  @IsString()
  @IsOptional()
  guestName?: string;

  @IsString()
  @IsOptional()
  guestEmail?: string;

  @IsString()
  @IsOptional()
  guestPhone?: string;

  @IsString()
  @IsOptional()
  locationId?: string;

  @IsString()
  @IsOptional()
  // Medium Fix: Restrict imageUrl to server-relative paths only — prevents SSRF via external URLs
  @Matches(/^\/files\//, { message: 'imageUrl must be a valid server-relative file path.' })
  imageUrl?: string;

  @IsString()
  @IsOptional()
  organizationId?: string; // Required for guest submission

  @IsEnum(Priority) // Medium Fix: Require strict priority matching
  @IsOptional()
  priority?: Priority;
}

export class UpdateRequestDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  // High Fix: status field REMOVED from UpdateRequestDto.
  // Status transitions must go through approve() or reject() dedicated endpoints only.
  // This prevents any user with UPDATE_REQUEST from bypassing the approval workflow.

  @IsString()
  @IsOptional()
  assetId?: string;

  @IsString()
  @IsOptional()
  locationId?: string;

  @IsEnum(Priority) // Medium Fix: Require strict priority matching
  @IsOptional()
  priority?: Priority;
}
