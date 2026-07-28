import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsEnum,
  Matches,
} from 'class-validator';

export enum TeamSize {
  SMALL = '1-5',
  MEDIUM = '6-10',
  LARGE = '11-20',
  XL = '21-50',
  XXL = '51-100',
  ENTERPRISE = '100+',
}

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsEnum(TeamSize)
  @IsNotEmpty()
  teamSize: TeamSize;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number.',
  })
  password: string;
}
