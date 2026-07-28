import { IsNotEmpty, IsString } from 'class-validator';

export class AddWorkOrderCommentDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}
