import { IsString, IsOptional, IsObject } from 'class-validator';

export class UpdatePermitDto {
  @IsOptional()
  @IsObject()
  riskAssessment?: any;

  @IsOptional()
  @IsObject()
  ppeChecklist?: any;

  @IsOptional()
  @IsObject()
  lotoChecklist?: any;
}

export class SignPermitDto {
  @IsString()
  signatureType: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
