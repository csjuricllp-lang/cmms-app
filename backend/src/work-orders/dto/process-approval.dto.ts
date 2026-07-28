import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ProcessApprovalDto {
  @IsEnum(['APPROVED', 'REJECTED'])
  status: 'APPROVED' | 'REJECTED';

  @IsString()
  @IsOptional()
  notes?: string;
}
