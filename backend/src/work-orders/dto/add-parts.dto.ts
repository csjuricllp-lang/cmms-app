import { IsArray, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PartEntryDto {
  @IsString()
  @IsNotEmpty()
  partId: string;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;
}

export class AddWorkOrderPartsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartEntryDto)
  parts: PartEntryDto[];
}
