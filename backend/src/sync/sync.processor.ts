import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictResolverService } from './conflict-resolver.service';
import { ChangeLogService } from './change-log.service';
import { SyncOperationResult } from './types';

@Processor('sync-queue')
@Injectable()
export class SyncProcessor extends WorkerHost {
  private readonly logger = new Logger(SyncProcessor.name);

  constructor(
    private prisma: PrismaService,
    private conflictResolver: ConflictResolverService,
    private changeLog: ChangeLogService,
  ) {
    super();
  }

  async process(job: Job<{ id: string; organizationId: string }>): Promise<SyncOperationResult> {
    const { id, organizationId } = job.data;

    // 1. Fetch the operation from queue
    const op = await this.prisma.syncQueue.findUnique({
      where: { id },
    });

    if (!op || op.status !== 'PENDING') return { success: false, error: 'Not pending' };

    await this.prisma.syncQueue.update({
      where: { id },
      data: { status: 'PROCESSING' },
    });

    try {
      const modelName = (op.entityType.charAt(0).toLowerCase() + op.entityType.slice(1)) as keyof PrismaService;
      const model = this.prisma[modelName] as any;

      if (op.operation === 'CREATE') {
        const result = await model.create({
          data: {
            ...(op.payload as any),
            organizationId: op.organizationId,
            version: 1,
          },
        });
        await this.changeLog.record(
          op.entityType,
          result.id,
          'CREATE',
          1,
          [],
          op.organizationId,
        );
      } else if (op.operation === 'UPDATE') {
        const serverState = await model.findUnique({
          where: { id: op.entityId },
        });

        if (!serverState) throw new Error('Entity not found for update');

        const { resolvedData, hasConflict, rejectedFields } =
          await this.conflictResolver.resolve(
            op.entityType,
            op.entityId,
            op.payload as any,
            op.clientVersion,
            serverState,
            op.userId,
            op.organizationId,
          );

        const result = await model.update({
          where: { id: op.entityId },
          data: {
            ...resolvedData,
            version: { increment: 1 },
            updatedByDeviceId: op.deviceId,
          },
        });

        const newVersion = (result as any).version;

        await this.changeLog.record(
          op.entityType,
          op.entityId,
          'UPDATE',
          newVersion,
          Object.keys(op.payload as any),
          op.organizationId,
        );
      } else if (op.operation === 'DELETE') {
        // Soft delete only
        const result = await model.update({
          where: { id: op.entityId },
          data: { deletedAt: new Date(), version: { increment: 1 } },
        });
        await this.changeLog.record(
          op.entityType,
          op.entityId,
          'DELETE',
          (result as any).version,
          [],
          op.organizationId,
        );
      }

      await this.prisma.syncQueue.update({
        where: { id },
        data: { status: 'COMPLETED', processedAt: new Date() },
      });
    } catch (err) {
      this.logger.error(`Sync Operation Failed: ${err.message}`);
      await this.prisma.syncQueue.update({
        where: { id },
        data: { status: 'FAILED', error: err.message },
      });
    }

    return { success: true };
  }
}
