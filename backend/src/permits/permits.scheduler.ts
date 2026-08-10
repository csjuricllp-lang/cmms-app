import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class PermitsScheduler {
  private readonly logger = new Logger(PermitsScheduler.name);

  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogsService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredPermits() {
    this.logger.log('Running expired permits job...');
    const now = new Date();

    const expiredPermits = await this.prisma.permit.findMany({
      where: {
        status: 'APPROVED',
        expiresAt: { lt: now },
        deletedAt: null,
      },
    });

    if (expiredPermits.length === 0) return;

    for (const permit of expiredPermits) {
      await this.prisma.permit.update({
        where: { id: permit.id },
        data: { status: 'EXPIRED' },
      });

      await this.auditLogService.create(
        'PERMIT',
        permit.id,
        'STATUS_CHANGE',
        { status: 'EXPIRED' },
        { status: 'APPROVED' },
      );

      this.logger.log(`Permit ${permit.number} expired.`);
    }

    this.logger.log(`Expired ${expiredPermits.length} permits.`);
  }
}
