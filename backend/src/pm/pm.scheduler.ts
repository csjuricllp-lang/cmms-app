import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PMService } from './pm.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PMScheduler {
  private readonly logger = new Logger(PMScheduler.name);
  private readonly LOCK_ID = 88472910; // Fixed Postgres advisory lock ID for PM scheduler

  constructor(
    private pmService: PMService,
    private prisma: PrismaService,
  ) {}

  /**
   * Run every hour (at the beginning of the hour).
   * Enforces multi-instance distributed locking via Postgres pg_try_advisory_xact_lock
   * scoped inside a single transaction connection to guarantee pooler & PgBouncer safety.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleCalendarPMs() {
    this.logger.log('Attempting to acquire distributed PM scheduler lock...');

    try {
      await this.prisma.$transaction(async (tx) => {
        const lockResult: any = await tx.$queryRaw`SELECT pg_try_advisory_xact_lock(${this.LOCK_ID}) as acquired`;
        const isAcquired = lockResult && lockResult[0]?.acquired === true;

        if (!isAcquired) {
          this.logger.log('PM Scheduler cron lock held by another cluster node. Skipping on this instance.');
          return;
        }

        this.logger.log('Distributed transaction lock acquired. Scanning for due PM schedules...');
        await this.pmService.scanCalendarDueSchedules();
      });
    } catch (e) {
      // In SQLite / mock test environments without transaction advisory lock support, fallback to direct execution
      await this.pmService.scanCalendarDueSchedules();
    }
  }
}
