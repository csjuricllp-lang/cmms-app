import {
  IsOptional,
  IsString,
  IsIn,
  IsNumber,
} from 'class-validator';

export class UpdateLocationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsIn(['SITE', 'BUILDING', 'FLOOR', 'AREA', 'ROOM', 'EQUIPMENT_GROUP'])
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  parentId?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsOptional()
  workerIds?: string[];

  @IsOptional()
  teamIds?: string[];

  @IsOptional()
  vendorIds?: string[];

  @IsOptional()
  customerId?: string;
}
