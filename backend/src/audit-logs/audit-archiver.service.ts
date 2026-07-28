import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { subDays } from 'date-fns';

@Injectable()
export class AuditArchiverService {
  private readonly logger = new Logger(AuditArchiverService.name);

  constructor(
    private prisma: PrismaService,
    private filesService: FilesService,
  ) {}

  /**
   * Weekly Cron: Archive logs older than 365 days.
   * Runs every Sunday at Midnight.
   */
  @Cron(CronExpression.EVERY_WEEK)
  async archiveOldLogs() {
    const retentionDays = 365;
    const thresholdDate = subDays(new Date(), retentionDays);
    
    this.logger.log(`Starting Audit Log archival for records older than ${retentionDays} days (before ${thresholdDate.toISOString()})...`);

    // 1. Identify organizations to process (to create separate archives per org if needed, 
    // but for simplicity we'll do global batching)
    const totalCount = await this.prisma.auditLog.count({
      where: { createdAt: { lt: thresholdDate } },
    });

    if (totalCount === 0) {
      this.logger.log('No logs found for archival.');
      return;
    }

    this.logger.log(`Found ${totalCount} logs to archive.`);

    const batchSize = 10000;
    let processed = 0;

    // We'll archive in chunks to avoid memory overflow
    while (processed < totalCount) {
      const logs = await this.prisma.auditLog.findMany({
        where: { createdAt: { lt: thresholdDate } },
        take: batchSize,
        orderBy: { createdAt: 'asc' },
      });

      if (logs.length === 0) break;

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `audit-archive-${timestamp}-${processed}.json`;
      const buffer = Buffer.from(JSON.stringify(logs, null, 2));

      try {
        // 2. Upload to S3/Storage
        const uploadResult = await this.filesService.uploadBuffer(
          buffer,
          filename,
          'application/json',
          'audit-archives'
        );

        this.logger.log(`Archived ${logs.length} logs to ${uploadResult.path}`);

        // 3. Delete from Database
        const ids = logs.map(l => l.id);
        await this.prisma.auditLog.deleteMany({
          where: { id: { in: ids } },
        });

        processed += logs.length;
        this.logger.log(`Progress: ${processed}/${totalCount} logs cleaned from DB.`);
      } catch (error) {
        this.logger.error(`Archival failed for batch starting at ${processed}: ${error.message}`);
        break; // Stop on failure to prevent data loss or infinite loops
      }
    }

    this.logger.log('Audit Log archival task completed.');
  }
}
