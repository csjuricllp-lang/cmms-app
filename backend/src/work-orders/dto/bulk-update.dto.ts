import { IsArray, IsOptional, IsString, IsUUID, ValidateNested, ArrayMaxSize, ArrayUnique } from 'class-validator';
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
  @ArrayMaxSize(500, { message: 'Maximum of 500 updates allowed per request to prevent DoS.' })
  @ArrayUnique((o: WorkOrderUpdateItem) => o.id, { message: 'Duplicate Work Order IDs are not allowed in the same bulk update.' })
  @ValidateNested({ each: true })
  @Type(() => WorkOrderUpdateItem)
  updates: WorkOrderUpdateItem[];
}
