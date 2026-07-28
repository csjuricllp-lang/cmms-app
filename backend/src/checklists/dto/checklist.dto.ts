import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateChecklistItemDto {
  @IsString()
  @IsNotEmpty()
  task: string;

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @IsIn([
    'CHECKBOX',
    'PASS_FAIL',
    'TEXT_INPUT',
    'NUMBER',
    'METER_READING',
    'SELECT',
  ])
  @IsOptional()
  type?: string;

  @IsOptional()
  options?: any;
}

export class CreateChecklistDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateChecklistItemDto)
  items: CreateChecklistItemDto[];
}

export class UpdateChecklistDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateChecklistItemDto)
  @IsOptional()
  items?: CreateChecklistItemDto[];
}
