import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class DeferredMaintenanceScheduler {
  private readonly logger = new Logger(DeferredMaintenanceScheduler.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // Run every day at 9 AM
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleOverdueDeferredWorkOrders() {
    this.logger.log('Scanning for overdue deferred work orders...');
    const today = new Date();

    const overdueWorkOrders = await this.prisma.workOrder.findMany({
      where: {
        status: 'ON_HOLD',
        deferredUntilDate: {
          lte: today,
        },
      },
      include: {
        assignedTo: { include: { user: true } },
      },
    });

    if (overdueWorkOrders.length === 0) {
      this.logger.log('No overdue deferred work orders found.');
      return;
    }

    this.logger.log(`Found ${overdueWorkOrders.length} overdue deferred work orders.`);

    for (const wo of overdueWorkOrders) {
      if (wo.assignedToId) {
        await this.notifications.create({
          type: 'SYSTEM_ALERT' as any,
          title: `⚠️ Overdue Deferred Work: ${wo.title}`,
          content: `Work Order #${wo.workOrderNo} was deferred until ${wo.deferredUntilDate?.toLocaleDateString()} and is now due for review.`,
          userId: wo.assignedToId,
          organizationId: wo.organizationId,
          metaData: { workOrderId: wo.id, actionUrl: `/work-orders?id=${wo.id}` },
        }).catch(err => this.logger.error(`Failed to create reminder for ${wo.id}`, err));
      }

      // We can also notify the person who deferred it
      if (wo.deferredById && wo.deferredById !== wo.assignedToId) {
         await this.notifications.create({
          type: 'SYSTEM_ALERT' as any,
          title: `⚠️ Overdue Deferred Work: ${wo.title}`,
          content: `Work Order #${wo.workOrderNo} that you deferred is now due for review.`,
          userId: wo.deferredById,
          organizationId: wo.organizationId,
          metaData: { workOrderId: wo.id, actionUrl: `/work-orders?id=${wo.id}` },
        }).catch(err => this.logger.error(`Failed to create reminder for deferredById ${wo.id}`, err));
      }
    }
  }
}
