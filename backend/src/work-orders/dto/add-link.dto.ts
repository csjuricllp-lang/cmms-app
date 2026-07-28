import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class AddLinkDto {
  @IsUUID()
  @IsNotEmpty()
  targetId: string;

  @IsString()
  @IsNotEmpty()
  type: string;
}
