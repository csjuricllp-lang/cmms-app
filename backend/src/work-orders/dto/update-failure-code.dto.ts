import { PartialType } from '@nestjs/mapped-types';
import { CreateFailureCodeDto } from './create-failure-code.dto';

export class UpdateFailureCodeDto extends PartialType(CreateFailureCodeDto) {}
