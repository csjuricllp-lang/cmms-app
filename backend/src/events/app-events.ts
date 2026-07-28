import { WorkOrderStatus } from '@prisma/client';

export enum AppEvents {
  ASSET_UPDATED = 'asset.updated',
  ASSET_DOWN = 'asset.down',
  METER_READING_LOGGED = 'meter.reading.logged',
  WORKORDER_CREATED = 'workorder.created',
  WORKORDER_STATUS_UPDATED = 'workorder.status.updated',
  WORKORDER_COMPLETED = 'workorder.completed',
}

export interface AssetUpdatedPayload {
  id: string;
  userId: string;
  organizationId: string;
  data: any;
}

export interface AssetDownPayload {
  id: string;
  name: string;
  status: string;
  organizationId: string;
}

export interface MeterReadingLoggedPayload {
  assetId: string;
  meterId: string;
  value: number;
  organizationId: string;
}

export interface WorkOrderCreatedPayload {
  id: string;
  userId: string;
  organizationId: string;
  title: string;
  workOrderNo: number;
  assignedToId?: string | null;
}

export interface WorkOrderStatusUpdatedPayload {
  id: string;
  fromStatus: WorkOrderStatus;
  toStatus: WorkOrderStatus;
  userId: string;
  organizationId: string;
}

export interface WorkOrderCompletedPayload {
  id: string;
  userId: string;
  organizationId: string;
  completedAt: Date;
}
