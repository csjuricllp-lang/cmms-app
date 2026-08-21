import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SLAScheduler {
  private readonly logger = new Logger(SLAScheduler.name);

  constructor(
    private prisma: PrismaService,
    @Inject('BullQueue_notifications') private notifyQueue: any,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async checkSLAEscalations() {
    this.logger.log('SLA Engine: Processing overdue work orders...');
    const now = new Date();

    // 1. Find Work Orders approaching or past resolutionTimeTarget that are not yet COMPLETED/CLOSED
    const overdueWO = await this.prisma.workOrder.findMany({
      where: {
        status: { notIn: ['COMPLETED', 'CLOSED'] },
        resolutionTimeTarget: { lte: now },
        isEscalated: false,
        deletedAt: null,
      },
      include: {
        organization: true,
        assignedTo: { include: { user: true } },
      },
    });

    for (const wo of overdueWO) {
      await this.escalateWorkOrder(wo);
    }

    // 2. Find Work Orders past responseTimeTarget that are still OPEN
    const delayedResponseWO = await this.prisma.workOrder.findMany({
      where: {
        status: 'OPEN',
        responseTimeTarget: { lte: now },
        isEscalated: false,
        deletedAt: null,
      },
      include: {
        organization: true,
        assignedTo: { include: { user: true } },
      },
    });

    for (const wo of delayedResponseWO) {
      await this.notifyManagementDelayedResponse(wo);
    }
  }

  private async escalateWorkOrder(wo: any) {
    this.logger.warn(`Escalating Work Order #${wo.id} due to SLA breach.`);

    await this.prisma.workOrder.update({
      where: { id: wo.id },
      data: {
        isEscalated: true,
        escalatedAt: new Date(),
        priority: 'CRITICAL', // Example escalation: bump priority
      },
    });

    // Queue notifications for manager
    await this.notifyQueue.add('sla-escalation', {
      workOrderId: wo.id,
      organizationId: wo.organizationId,
      originalPriority: wo.priority,
      reason: 'Resolution time target exceeded',
      assignedTo: wo.assignedTo?.user?.name || 'Unassigned',
    });

    // Create an in-app Notification for the assigned user (Reminder)
    if (wo.assignedToId) {
      await this.prisma.notification.create({
        data: {
          type: 'REMINDER',
          title: 'Reminder: Work Order Overdue',
          content: `Work Order #${wo.workOrderNo} - "${wo.title}" is overdue and has been escalated.`,
          userId: wo.assignedTo.user.id,
          organizationId: wo.organizationId,
          metaData: { workOrderId: wo.id },
        },
      });
    }
  }

  private async notifyManagementDelayedResponse(wo: any) {
    this.logger.warn(`Response delay notification for WO #${wo.id}`);

    // Queue notification
    await this.notifyQueue.add('sla-delayed-response', {
      workOrderId: wo.id,
      organizationId: wo.organizationId,
      reason: 'Response time target exceeded',
    });

    // Also, we could update database bit to avoid re-notifying every hour
    // (In real world, we'd have an `slaEscalationLevel` counter)

    // Create an in-app Notification (Reminder)
    if (wo.assignedToId && wo.assignedTo?.user?.id) {
      await this.prisma.notification.create({
        data: {
          type: 'REMINDER',
          title: 'Reminder: Action Required',
          content: `Work Order #${wo.workOrderNo} - "${wo.title}" is still OPEN and requires your attention.`,
          userId: wo.assignedTo.user.id,
          organizationId: wo.organizationId,
          metaData: { workOrderId: wo.id },
        },
      });
    }
  }
}
