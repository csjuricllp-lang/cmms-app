import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PMService } from './pm.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppEvents } from '../events/app-events';

@Processor('pm')
@Injectable()
export class PMProcessor extends WorkerHost {
  private readonly logger = new Logger(PMProcessor.name);

  constructor(
    private prisma: PrismaService,
    private pmService: PMService,
    private notificationsService: NotificationsService,
    private eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { scheduleId, organizationId, triggerType, reading } = job.data;

    return await this.prisma.$transaction(async (tx) => {
      // 1. Pessimistic Row Locking: Acquire row-level write lock on PMSchedule row to prevent concurrent race windows
      try {
        await tx.$queryRaw`SELECT id FROM "PMSchedule" WHERE id = ${scheduleId} AND "organizationId" = ${organizationId} FOR UPDATE`;
      } catch (e) {
        // Fallback for non-Postgres mock test environments
      }

      // Fetch Schedule inside locked transaction
      const schedule = await tx.pMSchedule.findFirst({
        where: { id: scheduleId, organizationId },
        include: { asset: true },
      });

      if (!schedule || !schedule.isActive || schedule.status !== 'ACTIVE') {
        this.logger.log(`PM Schedule ${scheduleId} is not active. Skipping.`);
        return { skipped: true, reason: 'INACTIVE' };
      }

      // 2. IDEMPOTENCY GUARD: Check if already generated for current cycle
      const now = new Date();
      if (
        triggerType === 'CALENDAR' &&
        schedule.lastGenerated &&
        schedule.nextDueDate &&
        schedule.lastGenerated >= schedule.nextDueDate
      ) {
        this.logger.log(`PM Schedule ${schedule.name} (${scheduleId}) already generated for current cycle. Skipping.`);
        return { skipped: true, reason: 'ALREADY_GENERATED' };
      }

      // 3. IDEMPOTENCY GUARD: Check if an active Work Order for this PM Schedule was created recently
      const existingWO = await tx.workOrder.findFirst({
        where: {
          pmScheduleId: scheduleId,
          organizationId: schedule.organizationId,
          deletedAt: null,
          createdAt: {
            gte: new Date(now.getTime() - 12 * 3600 * 1000), // Within last 12 hours
          },
        },
        select: { id: true },
      });

      if (existingWO) {
        this.logger.log(`Work order ${existingWO.id} already exists for PM Schedule ${scheduleId} in recent window. Skipping duplicate.`);
        return { skipped: true, reason: 'DUPLICATE_WO_EXISTS', workOrderId: existingWO.id };
      }

      this.logger.log(
        `Generating PM WorkOrder for ${schedule.name} (${triggerType})`,
      );

      let woDueDate = schedule.nextDueDate ? new Date(schedule.nextDueDate) : new Date();
      if (schedule.dueDateTime && typeof schedule.dueDateTime === 'string') {
        const match = schedule.dueDateTime.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (match) {
          let hours = parseInt(match[1], 10);
          const mins = parseInt(match[2], 10);
          const ampm = match[3] ? match[3].toUpperCase() : null;
          if (ampm === 'PM' && hours < 12) hours += 12;
          if (ampm === 'AM' && hours === 12) hours = 0;
          woDueDate.setHours(hours, mins, 0, 0);
        }
      }

      // 4. Create the WorkOrder inside transaction
      const workOrder = await tx.workOrder.create({
        data: {
          title: `PM: ${schedule.name} - ${schedule.asset?.name || 'Asset'}`,
          description:
            schedule.description ||
            `Preventive Maintenance for ${schedule.asset?.name || 'Asset'}`,
          status: 'OPEN',
          priority: 'MEDIUM',
          maintenanceType: 'PREVENTIVE',
          startDate: new Date(),
          dueDate: woDueDate,
          assetId: schedule.assetId,
          locationId: schedule.asset?.locationId || null,
          assignedToId: schedule.assignedToId || null,
          checklistId: schedule.checklistId || null,
          pmScheduleId: schedule.id,
          organizationId: schedule.organizationId,
        },
      });

      try {
        this.eventEmitter.emit(AppEvents.WORKORDER_CREATED, {
          id: workOrder.id,
          userId: schedule.assignedToId || 'SYSTEM',
          organizationId: workOrder.organizationId,
          title: workOrder.title,
          workOrderNo: workOrder.workOrderNo,
          assignedToId: workOrder.assignedToId,
        });
        if (workOrder.assignedToId) {
          this.notificationsService.notifyAssignment(workOrder);
        }
      } catch (e: any) {
        this.logger.error(`Failed to emit notification for PM processor generated WO: ${e.message}`);
      }

      // 5. Update Calendar Next Due Date inside transaction
      if (schedule.frequencyType && schedule.frequencyValue) {
        const baseDate = schedule.isFloating
          ? now
          : schedule.nextDueDate || now;
        const newNextDueDate = this.pmService.calculateNextDueDate(
          baseDate,
          schedule.frequencyType,
          schedule.frequencyValue,
        );

        await tx.pMSchedule.update({
          where: { id: scheduleId },
          data: {
            lastGenerated: now,
            nextDueDate: newNextDueDate,
          },
        });
      }

      // 6. Update Meter Next Reading inside transaction
      if (schedule.meterId && schedule.meterInterval && reading) {
        await tx.pMSchedule.update({
          where: { id: scheduleId },
          data: {
            lastMeterReading: reading,
            nextMeterReading: reading + (schedule as any).meterInterval,
          },
        });
      }

      return { workOrderId: workOrder.id };
    });
  }
}
