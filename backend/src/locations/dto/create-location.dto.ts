import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsIn,
  IsNumber,
} from 'class-validator';

export class CreateLocationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

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
  imageUrl?: string; // Floor plan or site photo URL

  @IsString()
  @IsOptional()
  timezone?: string; // e.g. 'Asia/Kolkata', 'America/New_York'

  @IsOptional()
  workerIds?: string[];

  @IsOptional()
  teamIds?: string[];

  @IsOptional()
  vendorIds?: string[];

  @IsOptional()
  customerId?: string;
}
