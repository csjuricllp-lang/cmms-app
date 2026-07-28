import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class AddWorkOrderPartDto {
  @IsString()
  @IsNotEmpty()
  partId: string;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;
}
