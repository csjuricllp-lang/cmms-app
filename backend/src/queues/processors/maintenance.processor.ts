import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Processor('maintenance')
export class MaintenanceQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(MaintenanceQueueProcessor.name);

  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(
      `Processing maintenance job ${job.id} for type: ${job.name}`,
    );

    if (job.name === 'generate-pm-workorder') {
      const { scheduleId, organizationId } = job.data;
      // Logic to generate WO from PM Schedule
      this.logger.log(`Generating WO for PM Schedule ${scheduleId}`);
    }

    return { success: true };
  }
}
