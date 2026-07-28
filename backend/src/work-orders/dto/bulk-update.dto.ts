import { IsArray, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class WorkOrderUpdateItem {
  @IsUUID()
  id: string;

  @IsUUID()
  @IsOptional()
  assignedToId?: string;

  @IsString()
  @IsOptional()
  startDate?: string;
}

export class BulkUpdateWorkOrdersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkOrderUpdateItem)
  updates: WorkOrderUpdateItem[];
}
