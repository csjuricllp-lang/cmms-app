import { PartialType } from '@nestjs/mapped-types';
import { CreatePMScheduleDto } from './create-pm-schedule.dto';

export class UpdatePMScheduleDto extends PartialType(CreatePMScheduleDto) {}
