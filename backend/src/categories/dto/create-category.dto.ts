import { IsString, IsEnum, IsHexColor, IsNotEmpty } from 'class-validator';
import { CategoryType } from '@prisma/client';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsHexColor()
  @IsNotEmpty()
  color: string;

  @IsEnum(CategoryType)
  @IsNotEmpty()
  type: CategoryType;
}
