import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Processor('inventory')
@Injectable()
export class InventoryProcessor extends WorkerHost {
  private readonly logger = new Logger(InventoryProcessor.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { partId, organizationId, currentQuantity, minQuantity } = job.data;

    if (job.name === 'low-stock-alert') {
      this.logger.warn(
        `Low stock alert for part ${partId}: ${currentQuantity} <= ${minQuantity}`,
      );

      const part = await this.prisma.part.findUnique({
        where: { id: partId },
      });

      if (part) {
        // Trigger multi-channel notification (Email/Push)
        await this.notificationsService.notifyLowStock(part);

        // Bonus: could auto-create a draft Purchase Order here
      }
    }

    return { success: true };
  }
}
