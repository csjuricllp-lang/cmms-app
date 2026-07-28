import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenancyContext } from '../common/tenancy.context';
import { randomUUID } from 'crypto';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private prisma: PrismaService,
    @Inject('BullQueue_sync-queue') private syncQueue: any,
  ) {}

  /**
   * Batch push: Enqueue operations for background processing
   */
  async push(payload: any[], deviceId: string, userId: string) {
    const orgId = TenancyContext.organizationId || '';
    const results: any[] = [];

    const entityMap: Record<string, string> = {
      'work-order': 'WorkOrder',
      'request': 'MaintenanceRequest',
      'part': 'Part',
      'reading': 'MeterReading',
    };

    for (const item of payload) {
      const entityType = entityMap[item.entity] || item.entity;
      const entityId = item.data?.id;
      const operation = item.action;
      const clientVersion = item.data?.version || 1;
      const clientUpdatedAt = new Date(item.data?.updatedAt || item.timestamp || Date.now());
      const requestId = item.requestId || randomUUID();

      const syncOp = await this.prisma.syncQueue.create({
        data: {
          entityType,
          entityId,
          operation,
          payload: item.data || {},
          clientVersion,
          clientUpdatedAt,
          deviceId,
          userId,
          requestId,
          organizationId: orgId,
          status: 'PENDING',
        },
      });

      // Add to BullMQ for processing
      await this.syncQueue.add('process-sync-op', {
        id: syncOp.id,
        organizationId: orgId,
      });

      results.push({
        requestId: item.requestId || requestId,
        syncId: syncOp.id,
        status: 'QUEUED',
      });
    }

    return results;
  }

  /**
   * Delta pull: Fetches changes since lastSyncAt
   */
  async pull(lastSyncAt: Date, deviceId: string) {
    const orgId = TenancyContext.organizationId;

    // 1. Fetch ChangeLogs since last sync (excluding changes from SAME device unless they are remote)
    const logs = await this.prisma.changeLog.findMany({
      where: {
        organizationId: orgId,
        changedAt: { gt: lastSyncAt },
      },
      orderBy: { changedAt: 'asc' },
    });

    // 2. Group logs by model for batched fetching
    const logsByModel = logs.reduce((acc: any, log: any) => {
      if (!acc[log.entityType]) acc[log.entityType] = [];
      acc[log.entityType].push(log);
      return acc;
    }, {});

    const changes: any[] = [];
    
    // 3. Batched fetch for each model
    for (const [entityType, modelLogs] of Object.entries(logsByModel) as [string, any][]) {
      const modelName = entityType.charAt(0).toLowerCase() + entityType.slice(1);
      const ids = modelLogs.map(l => l.entityId);
      
      const entities = await (this.prisma as any)[modelName].findMany({
        where: { id: { in: ids } },
      });

      // Map back to original log order
      for (const log of modelLogs) {
        const entity = entities.find((e: any) => e.id === log.entityId);
        if (entity) {
          changes.push({
            ...log,
            data: entity,
          });
        }
      }
    }

    // 4. Update SyncState for tracking
    await this.prisma.syncState.upsert({
      where: { userId_deviceId: { userId: TenancyContext.userId, deviceId } },
      update: { lastSyncAt: new Date() },
      create: {
        userId: TenancyContext.userId,
        deviceId,
        organizationId: orgId,
        lastSyncAt: new Date(),
      },
    });

    return changes;
  }
}
