import { IsOptional, IsString } from 'class-validator';

export class UpdateSettingDto {
  @IsString()
  @IsOptional()
  value?: string;
}
