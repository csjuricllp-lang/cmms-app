import { IsString, IsObject, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateSavedViewDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  entityType: string;

  @IsObject()
  config: any;

  @IsBoolean()
  @IsOptional()
  isShared?: boolean;
}

export class UpdateSavedViewDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  config?: any;

  @IsBoolean()
  @IsOptional()
  isShared?: boolean;
}
