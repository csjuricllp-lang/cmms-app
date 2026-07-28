import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Processor('audit')
@Injectable()
export class AuditQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(AuditQueueProcessor.name);

  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing audit job ${job.id}`);
    const auditData = job.data;

    if (auditData && auditData.action) {
      try {
        await this.prisma.auditLog.create({
          data: {
            action: auditData.action,
            model: auditData.model || 'Authorization',
            entityId: auditData.entityId || 'AUDIT_QUEUE',
            userId: auditData.userId || null,
            organizationId: auditData.organizationId || 'SYSTEM',
            newData: auditData.newData || null,
          },
        });
      } catch (err) {
        this.logger.error(`Failed to persist queued audit log: ${err.message}`, err.stack);
      }
    }

    return { success: true };
  }
}
