import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateMeterReadingDto {
  @IsNumber()
  @IsNotEmpty()
  value: number;

  @IsString()
  @IsNotEmpty()
  meterId: string;
}
