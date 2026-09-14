import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ScheduledReportsService {
  private readonly logger = new Logger(ScheduledReportsService.name);

  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, data: any) {
    const nextRunAt = this.calculateNextRunAt(data.frequency, data.deliveryTime);
    return this.prisma.scheduledReport.create({
      data: {
        ...data,
        organizationId,
        nextRunAt,
      },
    });
  }

  findAll(organizationId: string) {
    return this.prisma.scheduledReport.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const report = await this.prisma.scheduledReport.findFirst({
      where: { id, organizationId },
    });
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  async update(organizationId: string, id: string, data: any) {
    await this.findOne(organizationId, id); // check existence
    if (data.frequency || data.deliveryTime) {
       // Ideally calculate new nextRunAt if these changed
    }
    return this.prisma.scheduledReport.update({
      where: { id },
      data,
    });
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    return this.prisma.scheduledReport.delete({
      where: { id },
    });
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    this.logger.log('Checking for due scheduled reports...');
    const now = new Date();
    const dueReports = await this.prisma.scheduledReport.findMany({
      where: {
        isActive: true,
        nextRunAt: {
          lte: now,
        },
      },
    });

    if (dueReports.length > 0) {
      this.logger.log(`Found ${dueReports.length} due reports.`);
    }

    for (const report of dueReports) {
      try {
        // Mock generation and sending
        this.logger.log(`[Report ${report.id}] Generating ${report.format} report: ${report.name}`);
        this.logger.log(`[Report ${report.id}] Sending to ${report.recipients.join(', ')}`);
        
        // Calculate next run
        const nextRunAt = this.calculateNextRunAt(report.frequency, report.deliveryTime);
        
        await this.prisma.scheduledReport.update({
          where: { id: report.id },
          data: {
            lastSentAt: now,
            nextRunAt,
          },
        });
        
        this.logger.log(`[Report ${report.id}] Success. Next run at: ${nextRunAt.toISOString()}`);
      } catch (err) {
        this.logger.error(`[Report ${report.id}] Error processing report:`, err);
      }
    }
  }

  private calculateNextRunAt(frequency: string, time: string): Date {
    // Basic fallback if not provided properly
    if (!time || !time.includes(':')) {
       time = '08:00';
    }
    
    const [hours, minutes] = time.split(':').map(Number);
    let nextRun = new Date();
    nextRun.setHours(hours, minutes, 0, 0);

    if (nextRun <= new Date()) {
      nextRun.setDate(nextRun.getDate() + 1); // move to next day if time has passed today
    }

    if (frequency === 'WEEKLY') {
      nextRun.setDate(nextRun.getDate() + 7);
    } else if (frequency === 'MONTHLY') {
      nextRun.setMonth(nextRun.getMonth() + 1);
    }
    
    return nextRun;
  }
}
