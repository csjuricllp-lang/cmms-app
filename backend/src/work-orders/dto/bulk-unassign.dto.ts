import { IsArray, IsUUID } from 'class-validator';

export class BulkUnassignDto {
  @IsArray()
  @IsUUID('4', { each: true })
  workOrderIds: string[];
}
