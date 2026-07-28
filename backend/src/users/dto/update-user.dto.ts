import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { SystemRole } from '../../auth/constants/system-roles';

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsIn(Object.values(SystemRole))
  @IsOptional()
  role?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  jobTitle?: string;

  @IsOptional()
  hourlyRate?: number;

  @IsOptional()
  companyRate?: number;

  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  deactivationReason?: string;
}
