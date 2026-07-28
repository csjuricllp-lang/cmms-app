import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import { MailService } from '../mail/mail.service';
import { PushNotificationService } from './push-notification.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsGateway))
    private readonly gateway: NotificationsGateway,
    private readonly mailService: MailService,
    private readonly pushService: PushNotificationService,
  ) {}

  // Run every morning at 8:00 AM (or more frequently for testing)
  @Cron('0 8 * * *')
  async checkOverdueWorkOrders() {
    this.logger.log('Running @Cron to check for overdue work orders...');

    // Find all OPEN or IN_PROGRESS work orders where dueDate < NOW
    const overdueWorkOrders = await this.prisma.workOrder.findMany({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        dueDate: { lt: new Date() },
        deletedAt: null,
      },
      include: {
        assignedTo: { include: { user: true } },
      },
    });

    for (const wo of overdueWorkOrders) {
      this.logger.warn(`Work Order ${wo.id} (${wo.title}) is OVERDUE!`);

      // Emit real-time push notification if user is online
      if (wo.assignedToId) {
        this.gateway.notifyOverdueAlert(wo.assignedToId, wo);
        
        // Native PWA Push Notification
        await this.pushService.sendNotification(
          wo.assignedToId, 
          '⚠️ Mission Overdue', 
          `Work Order #${wo.workOrderNo || wo.id.substring(0,8)} is past due. Action required.`,
          `/work-orders/${wo.id}`
        );

        if (wo.assignedTo?.user?.email) {
          await this.mailService
            .sendWorkOrderNotification(
              wo.assignedTo.user.email,
              'OVERDUE Work Order Alert',
              `Work order #${wo.workOrderNo}: "${wo.title}" is now overdue. Please update the status.`,
              `/work-orders/${wo.id}`,
            )
            .catch(() => {});
        }
      }
    }
  }

  // Hook these inside WorkOrdersService instead of duplicating logic
  async notifyAssignment(workOrder: any) {
    if (!workOrder.assignedToId) return;

    // 1. Create persistent in-app notification
    const notification = await this.prisma.notification.create({
      data: {
        type: 'WORK_ORDER_ASSIGNED',
        title: 'New Mission Assigned',
        content: `You have been assigned to Work Order #${workOrder.workOrderNo || workOrder.id.substring(0, 8)}: "${workOrder.title}"`,
        userId: workOrder.assignedToId,
        organizationId: workOrder.organizationId,
        metaData: { workOrderId: workOrder.id },
      },
    });

    // 2. Emit real-time WebSocket events
    // One for the global alert popup
    this.gateway.notifyWorkOrderAssignment(workOrder.assignedToId, workOrder);
    // One for the bell icon/intelligence hub
    this.gateway.notifyNotification(workOrder.assignedToId, notification);

    // Native PWA Push Notification
    await this.pushService.sendNotification(
      workOrder.assignedToId,
      '🚀 New Mission Assigned',
      `You have been assigned to: ${workOrder.title}`,
      `/work-orders/${workOrder.id}`
    );

    // 3. Send Email Notification (Mocked)
    const assignee = await this.prisma.userOrganization.findUnique({
      where: { id: workOrder.assignedToId },
      include: { user: true },
    });

    if (assignee?.user?.email) {
      await this.mailService.sendWorkOrderNotification(
        assignee.user.email,
        'Mission Assigned',
        `Engineer, you have been assigned a new mission: "${workOrder.title}". Priority: ${workOrder.priority}.`,
        `/work-orders/${workOrder.id}`,
      ).catch(err => this.logger.error(`Failed to send assignment email: ${err.message}`));
    }

    this.logger.log(`Assignment notification dispatched for user: ${workOrder.assignedToId}`);
  }

  async notifyLowStock(part: any) {
    this.gateway.server.emit('low_stock', part);
    this.logger.warn(
      `Dispatching Low Stock Alert for Part: ${part.name} (Qty: ${part.quantity} <= Min: ${part.minQuantity})`,
    );

    if (!part.organizationId) return;

    try {
      // Find managers and admins in the same organization
      const managers = await this.prisma.userOrganization.findMany({
        where: {
          organizationId: part.organizationId,
          role: {
            name: { in: ['ADMINISTRATOR', 'OWNER', 'MANAGER', 'ADMIN', 'LIMITED ADMINISTRATOR', 'MAINTENANCE MANAGER', 'Administrator', 'Owner', 'Manager', 'Admin', 'Limited Administrator', 'Maintenance Manager', 'administrator', 'owner', 'manager', 'admin', 'limited administrator', 'maintenance manager'] }
          }
        },
        include: { user: true }
      });

      for (const manager of managers) {
        // 1. Create persistent database notification
        const notification = await this.prisma.notification.create({
          data: {
            type: 'LOW_STOCK',
            title: 'Low Stock Alert',
            content: `Part "${part.name}" is low on stock (Qty: ${part.quantity} <= Min: ${part.minQuantity}).`,
            userId: manager.id,
            organizationId: part.organizationId,
            metaData: { partId: part.id },
          },
        });

        // 2. Emit real-time WebSocket event specifically to this manager
        this.gateway.notifyNotification(manager.id, notification);

        // Native PWA Push Notification
        await this.pushService.sendNotification(
          manager.id,
          '⚠️ Low Stock Alert',
          `Part "${part.name}" is low on stock (Qty: ${part.quantity}).`,
          `/inventory`
        );

        // 3. Send Email Notification
        if (manager.user?.email) {
          await this.mailService.sendInventoryAlert(
            manager.user.email,
            'Low Stock Alert',
            `Part "${part.name}" is running low on stock. Current Quantity: ${part.quantity}. Minimum Required: ${part.minQuantity}. Please review inventory and consider generating a Purchase Order.`,
            `/inventory`
          ).catch(err => this.logger.error(`Failed to send low stock email: ${err.message}`));
        }
      }
      this.logger.log(`Low stock alerts dispatched to ${managers.length} managers.`);
    } catch (error) {
      this.logger.error(`Failed to dispatch low stock alerts: ${error.message}`);
    }
  }

  async notifyWorkOrderCompleted(workOrder: any) {
    if (!workOrder.organizationId) return;

    try {
      // Find managers and admins in the same organization
      const managers = await this.prisma.userOrganization.findMany({
        where: {
          organizationId: workOrder.organizationId,
          role: {
            name: { in: ['ADMINISTRATOR', 'OWNER', 'MANAGER', 'ADMIN', 'LIMITED ADMINISTRATOR', 'MAINTENANCE MANAGER', 'Administrator', 'Owner', 'Manager', 'Admin', 'Limited Administrator', 'Maintenance Manager', 'administrator', 'owner', 'manager', 'admin', 'limited administrator', 'maintenance manager'] }
          }
        },
        include: { user: true }
      });

      for (const manager of managers) {
        // 1. Create persistent database notification
        const notification = await this.prisma.notification.create({
          data: {
            type: 'WORK_ORDER_COMPLETED',
            title: 'Mission Completed',
            content: `Work Order #${workOrder.workOrderNo || workOrder.id.substring(0, 8)}: "${workOrder.title}" has been completed.`,
            userId: manager.id,
            organizationId: workOrder.organizationId,
            metaData: { workOrderId: workOrder.id },
          },
        });

        // 2. Emit real-time WebSocket event specifically to this manager
        this.gateway.notifyNotification(manager.id, notification);

        // Native PWA Push Notification
        await this.pushService.sendNotification(
          manager.id,
          '✅ Mission Completed',
          `Work Order: ${workOrder.title} has been completed.`,
          `/work-orders/${workOrder.id}`
        );

        // 3. Send Email Notification
        if (manager.user?.email) {
          await this.mailService.sendWorkOrderNotification(
            manager.user.email,
            'Mission Completed',
            `Work Order #${workOrder.workOrderNo || workOrder.id.substring(0, 8)}: "${workOrder.title}" has been successfully completed.`,
            `/work-orders/${workOrder.id}`
          ).catch(err => this.logger.error(`Failed to send completion email: ${err.message}`));
        }
      }
      this.logger.log(`Work Order completion alerts dispatched to ${managers.length} managers.`);
    } catch (error) {
      this.logger.error(`Failed to dispatch Work Order completion alerts: ${error.message}`);
    }
  }

  async notifyWorkOrderReviewed(workOrder: any, status: 'CLOSED' | 'IN_PROGRESS') {
    try {
      if (!workOrder.assignedToId) return;

      const userOrg = await this.prisma.userOrganization.findUnique({
        where: { id: workOrder.assignedToId },
        include: { user: true }
      });
      if (!userOrg) return;

      const isApproved = status === 'CLOSED';
      const type = isApproved ? 'WORK_ORDER_APPROVED' : 'WORK_ORDER_REJECTED';
      const title = isApproved ? 'Mission Approved & Closed' : 'Mission Returned for Review';
      const content = isApproved
        ? `Work Order #${workOrder.workOrderNo || workOrder.id.substring(0, 8)}: "${workOrder.title}" has been reviewed and closed by management.`
        : `Work Order #${workOrder.workOrderNo || workOrder.id.substring(0, 8)}: "${workOrder.title}" was returned to In Progress. Please check closeout comments.`;

      const notification = await this.prisma.notification.create({
        data: {
          type,
          title,
          content,
          userId: userOrg.id,
          organizationId: workOrder.organizationId,
          metaData: { workOrderId: workOrder.id },
        },
      });

      this.gateway.notifyNotification(userOrg.id, notification);

      await this.pushService.sendNotification(
        userOrg.id,
        isApproved ? '🎉 Mission Approved' : '⚠️ Mission Returned',
        content,
        `/work-orders/${workOrder.id}`
      );

      if (userOrg.user?.email) {
        await this.mailService.sendWorkOrderNotification(
          userOrg.user.email,
          title,
          content,
          `/work-orders/${workOrder.id}`
        ).catch(err => this.logger.error(`Failed to send review email: ${err.message}`));
      }
      this.logger.log(`Work Order review alert dispatched to technician (${userOrg.id}).`);
    } catch (error) {
      this.logger.error(`Failed to dispatch Work Order review alert: ${error.message}`);
    }
  }

  async create(data: {
    type: string;
    title: string;
    content: string;
    userId: string;
    organizationId: string;
    metaData?: any;
  }) {
    const notification = await this.prisma.notification.create({
      data,
    });

    // Emit real-time push via socket if user is online
    if (data.userId) {
      this.gateway.notifyNotification(data.userId, notification);
    }
  }
  async findAllForUser(userId: string, organizationId: string, since?: Date) {
    return this.prisma.notification.findMany({
      where: { 
        userId, 
        organizationId,
        ...(since ? { createdAt: { gt: since } } : {})
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.update({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
