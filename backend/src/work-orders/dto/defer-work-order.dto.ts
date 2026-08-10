import { IsString, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class DeferWorkOrderDto {
  @IsString()
  @IsNotEmpty()
  onHoldReason: string;

  @IsDateString()
  @IsNotEmpty()
  deferredUntilDate: string;

  @IsString()
  @IsNotEmpty()
  deferredRiskLevel: string;

  @IsString()
  @IsOptional()
  deferredComments?: string;
}
