import { IsString, IsObject, IsNotEmpty } from 'class-validator';

export class CreateSavedViewDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  entityType: string;

  @IsObject()
  config: any;
}
