import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { Priority, WorkOrderStatus, MaintenanceType } from '@prisma/client';

export class CreateWorkOrderDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  status?: WorkOrderStatus;

  @IsOptional()
  priority?: Priority;

  @IsOptional()
  maintenanceType?: MaintenanceType;

  @IsString()
  @IsOptional()
  category?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsNumber()
  @IsOptional()
  estimatedHours?: number;

  @IsString()
  @IsOptional()
  assetId?: string;

  @IsString()
  @IsOptional()
  locationId?: string;

  @IsString()
  @IsOptional()
  assignedToId?: string;

  @IsString()
  @IsOptional()
  assignedTeamId?: string;

  @IsString()
  @IsOptional()
  checklistId?: string;

  @IsString()
  @IsOptional()
  parentWorkOrderId?: string;

  @IsString()
  @IsOptional()
  pmScheduleId?: string;

  @IsString()
  @IsOptional()
  vendorId?: string;

  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @IsBoolean()
  @IsOptional()
  requiresLOTO?: boolean;

  @IsBoolean()
  @IsOptional()
  signatureRequired?: boolean;

  @IsBoolean()
  @IsOptional()
  isDowntimeEvent?: boolean;

  @IsNumber()
  @IsOptional()
  downtimeMinutes?: number;

  @IsBoolean()
  @IsOptional()
  isBookmarked?: boolean;

  @IsBoolean()
  @IsOptional()
  isRepeating?: boolean;

  @IsOptional()
  customFields?: any; // Accepting JSON object for custom specs

  @IsString()
  @IsOptional()
  problemCode?: string;

  @IsString()
  @IsOptional()
  rootCause?: string;

  @IsString()
  @IsOptional()
  rootCauseDetails?: string;

  @IsString()
  @IsOptional()
  rootCauseCode?: string;

  @IsString()
  @IsOptional()
  actionCode?: string;

  @IsString()
  @IsOptional()
  failureCodeId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  technicianIds?: string[];

  @IsNumber()
  @IsOptional()
  estimatedCost?: number;

  @IsString()
  @IsOptional()
  customStatusId?: string;

  @IsString()
  @IsOptional()
  approvalChainId?: string;

  @IsArray()
  @IsOptional()
  tasks?: any[];

  @IsArray()
  @IsOptional()
  parts?: any[];
}

export class UpdateWorkOrderDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  status?: WorkOrderStatus;

  @IsOptional()
  priority?: Priority;

  @IsOptional()
  maintenanceType?: MaintenanceType;

  @IsString()
  @IsOptional()
  category?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  completedAt?: string;

  @IsNumber()
  @IsOptional()
  estimatedHours?: number;

  @IsNumber()
  @IsOptional()
  actualHours?: number;

  @IsString()
  @IsOptional()
  assetId?: string;

  @IsString()
  @IsOptional()
  locationId?: string;

  @IsString()
  @IsOptional()
  assignedToId?: string;

  @IsString()
  @IsOptional()
  assignedTeamId?: string;

  @IsString()
  @IsOptional()
  checklistId?: string;

  @IsString()
  @IsOptional()
  parentWorkOrderId?: string;

  @IsString()
  @IsOptional()
  pmScheduleId?: string;

  @IsString()
  @IsOptional()
  vendorId?: string;

  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @IsString()
  @IsOptional()
  onHoldReason?: string;

  @IsString()
  @IsOptional()
  resolutionNotes?: string;

  @IsString()
  @IsOptional()
  signatureUrl?: string;

  @IsString()
  @IsOptional()
  signedById?: string;

  @IsNumber()
  @IsOptional()
  additionalCost?: number;

  @IsBoolean()
  @IsOptional()
  requiresLOTO?: boolean;

  @IsBoolean()
  @IsOptional()
  signatureRequired?: boolean;

  @IsBoolean()
  @IsOptional()
  isDowntimeEvent?: boolean;

  @IsNumber()
  @IsOptional()
  downtimeMinutes?: number;

  @IsBoolean()
  @IsOptional()
  isBookmarked?: boolean;

  @IsBoolean()
  @IsOptional()
  isRepeating?: boolean;

  @IsOptional()
  customFields?: any;

  @IsString()
  @IsOptional()
  problemCode?: string;

  @IsString()
  @IsOptional()
  rootCause?: string;

  @IsString()
  @IsOptional()
  rootCauseDetails?: string;

  @IsString()
  @IsOptional()
  rootCauseCode?: string;

  @IsString()
  @IsOptional()
  actionCode?: string;

  @IsString()
  @IsOptional()
  failureCodeId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  technicianIds?: string[];

  @IsString()
  @IsOptional()
  customStatusId?: string;

  @IsString()
  @IsOptional()
  approvalChainId?: string;

  @IsString()
  @IsOptional()
  reopenReason?: string;

  @IsNumber()
  @IsOptional()
  estimatedCost?: number;

  @IsNumber()
  @IsOptional()
  laborCost?: number;

  @IsNumber()
  @IsOptional()
  partsCost?: number;

  @IsString()
  @IsOptional()
  statusChangeReason?: string; // Captures reason for SLA audit log

  @IsArray()
  @IsOptional()
  tasks?: any[];

  @IsArray()
  @IsOptional()
  parts?: any[];
}
