import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { AppEvents } from '../app-events';
import type { WorkOrderCreatedPayload, WorkOrderStatusUpdatedPayload, WorkOrderCompletedPayload } from '../app-events';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class WorkOrderEventsListener {
  private readonly logger = new Logger(WorkOrderEventsListener.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  @OnEvent(AppEvents.WORKORDER_CREATED)
  async handleWorkOrderCreated(payload: WorkOrderCreatedPayload) {
    this.logger.log(`Work order created: ${payload.id}`);

    // Auto-create audit log
    await this.prisma.auditLog
      .create({
        data: {
          action: 'WORK_ORDER_CREATED',
          model: 'WorkOrder',
          entityId: payload.id,
          userId: payload.userId,
          organizationId: payload.organizationId,
          newData: JSON.parse(JSON.stringify(payload)),
        },
      })
      .catch((err) => this.logger.error('Failed to create audit log', err));
  }

  @OnEvent(AppEvents.WORKORDER_STATUS_UPDATED)
  async handleWorkOrderStatusUpdated(payload: WorkOrderStatusUpdatedPayload) {
    this.logger.log(
      `Work order status updated: ${payload.id} (${payload.fromStatus} -> ${payload.toStatus})`,
    );

    await this.prisma.auditLog
      .create({
        data: {
          action: 'WORK_ORDER_STATUS_CHANGED',
          model: 'WorkOrder',
          entityId: payload.id,
          userId: payload.userId,
          organizationId: payload.organizationId,
          oldData: { status: payload.fromStatus },
          newData: { status: payload.toStatus },
        },
      })
      .catch((err) =>
        this.logger.error('Failed to create status audit log', err),
      );

    if (payload.fromStatus === 'COMPLETED' && (payload.toStatus === 'CLOSED' || payload.toStatus === 'IN_PROGRESS')) {
      const workOrder = await this.prisma.workOrder.findUnique({
        where: { id: payload.id },
      });
      if (workOrder) {
        await this.notificationsService.notifyWorkOrderReviewed(workOrder, payload.toStatus as 'CLOSED' | 'IN_PROGRESS');
      }
    }
  }

  @OnEvent(AppEvents.WORKORDER_COMPLETED)
  async handleWorkOrderCompleted(payload: WorkOrderCompletedPayload) {
    this.logger.log(`Work order completed: ${payload.id}`);

    await this.prisma.auditLog
      .create({
        data: {
          action: 'WORK_ORDER_COMPLETED',
          model: 'WorkOrder',
          entityId: payload.id,
          userId: payload.userId,
          organizationId: payload.organizationId,
          newData: JSON.parse(JSON.stringify(payload)),
        },
      })
      .catch((err) =>
        this.logger.error('Failed to create completion audit log', err),
      );

    // Fetch the full work order details needed for notifications
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id: payload.id },
      include: { request: true }, // Include request if we want to notify requester later
    });

    if (workOrder) {
      await this.notificationsService.notifyWorkOrderCompleted(workOrder);
    }
  }
}
