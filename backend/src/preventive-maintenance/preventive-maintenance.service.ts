import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  CreatePMScheduleDto,
  UpdatePMScheduleDto,
} from './dto/pm-schedule.dto';
import { TenancyContext } from '../common/tenancy.context';
import { DateService } from '../common/date.service';
import { AppEvents } from '../events/app-events';
import type { MeterReadingLoggedPayload } from '../events/app-events';
import { Prisma, PMSchedule } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

const PM_INCLUDES = {
  asset: {
    include: {
      location: true,
    },
  },
  checklist: true,
  assignedTo: true,
  meter: true,
  plannedParts: { include: { part: true } },
  plannedTasks: true,
} as const;

export type PMScheduleWithRelations = Prisma.PMScheduleGetPayload<{
  include: typeof PM_INCLUDES;
}>;

@Injectable()
export class PreventiveMaintenanceService {
  private readonly logger = new Logger(PreventiveMaintenanceService.name);

  constructor(
    private prisma: PrismaService,
    private dateService: DateService,
    private notificationsService: NotificationsService,
    private eventEmitter: EventEmitter2,
  ) {}

  @OnEvent(AppEvents.METER_READING_LOGGED)
  async handleMeterReading(payload: MeterReadingLoggedPayload) {
    this.logger.log(
      `Evaluating Meter PM for Asset ${payload.assetId} at value ${payload.value}`,
    );
    // We MUST wrap this in runAsync because it's a background event without a request context
    await TenancyContext.runAsync(
      {
        organizationId: payload.organizationId,
        userId: 'SYSTEM',
        userOrgId: 'SYSTEM',
        role: 'SYSTEM',
        teamIds: [],
        locationIds: [],
        permissions: [],
      },
      () => this.processSchedules(),
    );
  }

  async create(createPMScheduleDto: CreatePMScheduleDto): Promise<PMSchedule[]> {
    const { plannedParts, plannedTasks, inactivePeriods, assets, createNow, ...rest } = createPMScheduleDto;

    const cleanRest: any = { ...rest };
    if (cleanRest.assignedToId === '') delete cleanRest.assignedToId;
    if (cleanRest.categoryId === '') delete cleanRest.categoryId;
    if (cleanRest.checklistId === '') delete cleanRest.checklistId;
    if (cleanRest.teamId === '') delete cleanRest.teamId;
    if (cleanRest.meterId === '') delete cleanRest.meterId;

    const results: PMSchedule[] = [];
    
    // Industrial Strategy: If assets are provided in a table, we create one schedule per row
    const targetAssets = assets && assets.length > 0 ? assets : [{ assetId: cleanRest.assetId, meterId: cleanRest.meterId, assignedToId: cleanRest.assignedToId, startDate: cleanRest.nextDueDate }];

    for (const assetRow of targetAssets) {
      if (!assetRow.assetId) continue;

      let meterData = {};
      const currentMeterId = (assetRow.meterId || cleanRest.meterId) || undefined;
      const currentAssignedToId = (assetRow.assignedToId || cleanRest.assignedToId) || undefined;
      const currentStartDate = assetRow.startDate || cleanRest.nextDueDate;

      if ((createPMScheduleDto.frequencyType === 'METER' || createPMScheduleDto.frequencyType === 'HYBRID') && currentMeterId) {
        const meter = await this.prisma.meter.findUnique({
          where: { id: currentMeterId },
        });
        if (meter) {
          const triggerType = createPMScheduleDto.meterTriggerType || 'INTERVAL';
          const interval = new Prisma.Decimal(createPMScheduleDto.meterInterval || 0);
          
          let nextReading = new Prisma.Decimal(meter.currentValue || 0).plus(interval);
          if (triggerType === 'THRESHOLD') {
            nextReading = interval; // In threshold mode, the interval input is the target value
          }

          meterData = {
            meterId: currentMeterId,
            lastMeterReading: meter.currentValue || 0,
            nextMeterReading: nextReading,
          };
        }
      }

      const organizationId = TenancyContext.organizationId || '';
      const schedule = await this.prisma.pMSchedule.create({
        data: { 
          ...cleanRest, 
          ...meterData, 
          organizationId,
          assetId: assetRow.assetId,
          assignedToId: currentAssignedToId,
          nextDueDate: currentStartDate ? await this.calculateInitialNextDueDate(assetRow.assetId, currentStartDate, cleanRest.dueDateTime) : undefined,
          plannedParts: plannedParts ? {
            create: plannedParts.map(p => ({ 
              partId: p.partId, 
              quantity: p.quantity, 
              organizationId,
            }))
          } : undefined,
          plannedTasks: plannedTasks ? {
            create: plannedTasks.map((t, i) => ({ 
              task: t.task, 
              order: i, 
              organizationId,
            }))
          } : undefined,
          inactivePeriods: inactivePeriods ? {
            create: inactivePeriods.map(p => ({ 
              startDate: new Date(p.startDate), 
              endDate: new Date(p.endDate), 
              reason: p.reason
            }))
          } : undefined
        },
        include: {
          asset: {
            include: {
              location: true,
            },
          },
          checklist: true,
          assignedTo: true,
          plannedParts: { include: { part: true } },
          plannedTasks: true,
          inactivePeriods: true
        },
      });

      if (createNow) {
        await this.generateWorkOrder(schedule);

        const now = new Date();
        const baseDate = (schedule.isFloating ? now : (schedule.nextDueDate ? new Date(schedule.nextDueDate) : now)) as Date;
        const timezone = (schedule as any).asset?.location?.timezone || 'UTC';
        const localizedBase = this.dateService.toTimezone(baseDate, timezone);
        const localizedNext = this.dateService.calculateNextDueDate(
          localizedBase,
          schedule.frequencyType as any,
          schedule.frequencyValue || 1,
        );
        const localizedNextWithTime = this.applyTime(localizedNext, schedule.dueDateTime);
        const nextDue = this.dateService.toUTC(localizedNextWithTime, timezone);

        const updatedSchedule = await this.prisma.pMSchedule.update({
          where: { id: schedule.id },
          data: {
            lastGenerated: now,
            nextDueDate: nextDue,
          },
          include: PM_INCLUDES,
        });
        results.push(updatedSchedule);
      } else {
        results.push(schedule);
      }
    }

    return results;
  }

  async findAll(query?: any) {
    const {
      page,
      limit,
      search,
      status,
      priority,
      assetId,
      locationId,
      assignedToId,
      assignedTeamId,
    } = query || {};

    const where: any = {};

    if (status) where.status = status.includes(',') ? { in: status.split(',') } : status;
    if (priority) where.priority = priority.includes(',') ? { in: priority.split(',') } : priority;
    if (assetId) where.assetId = assetId.includes(',') ? { in: assetId.split(',') } : assetId;
    if (locationId) {
      where.asset = { locationId: locationId.includes(',') ? { in: locationId.split(',') } : locationId };
    }
    if (assignedToId) where.assignedToId = assignedToId.includes(',') ? { in: assignedToId.split(',') } : assignedToId;
    if (assignedTeamId) where.assignedTeamId = assignedTeamId.includes(',') ? { in: assignedTeamId.split(',') } : assignedTeamId;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { woTitle: { contains: search, mode: 'insensitive' } },
        { asset: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (!page || !limit) {
      const items = await this.prisma.pMSchedule.findMany({
        where,
        include: PM_INCLUDES,
        orderBy: { createdAt: 'desc' },
      });
      return items;
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      this.prisma.pMSchedule.findMany({
        where,
        include: PM_INCLUDES,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.pMSchedule.count({ where }),
    ]);

    return {
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  async findOne(id: string): Promise<PMScheduleWithRelations> {
    const schedule = await this.prisma.pMSchedule.findFirst({
      where: { id },
      include: PM_INCLUDES,
    });
    if (!schedule) {
      throw new NotFoundException(`PM Schedule with ID ${id} not found`);
    }
    return schedule;
  }

  async update(id: string, updatePMScheduleDto: UpdatePMScheduleDto): Promise<PMSchedule> {
    const { plannedParts, plannedTasks, inactivePeriods, createNow, ...rest } = updatePMScheduleDto;

    const cleanRest: any = { ...rest };
    if (cleanRest.assignedToId === '') cleanRest.assignedToId = null;
    if (cleanRest.categoryId === '') cleanRest.categoryId = null;
    if (cleanRest.checklistId === '') cleanRest.checklistId = null;
    if (cleanRest.teamId === '') cleanRest.teamId = null;
    if (cleanRest.meterId === '') cleanRest.meterId = null;

    if (cleanRest.nextDueDate) {
      const existing = await this.prisma.pMSchedule.findUnique({ where: { id } });
      const assetId = cleanRest.assetId || existing?.assetId;
      if (assetId) {
        cleanRest.nextDueDate = await this.calculateInitialNextDueDate(
          assetId,
          cleanRest.nextDueDate,
          cleanRest.dueDateTime || existing?.dueDateTime
        );
      }
    }

    // Handle nested updates for parts and tasks
    if (plannedParts) {
      await this.prisma.pMSchedulePlannedPart.deleteMany({ where: { pmScheduleId: id } });
    }
    if (plannedTasks) {
      await this.prisma.pMScheduleTask.deleteMany({ where: { pmScheduleId: id } });
    }

    const organizationId = TenancyContext.organizationId || '';

    return this.prisma.pMSchedule.update({
      where: { id },
      data: {
        ...(cleanRest as any),
        plannedParts: plannedParts ? {
          create: plannedParts.map(p => ({ 
            partId: p.partId, 
            quantity: p.quantity, 
            organizationId,
          }))
        } : undefined,
        plannedTasks: plannedTasks ? {
          create: plannedTasks.map((t, i) => ({ 
            task: t.task, 
            order: i, 
            organizationId,
          }))
        } : undefined
      },
      include: {
        plannedParts: true,
        plannedTasks: true
      }
    });
  }

  async remove(id: string) {
    await this.prisma.pMSchedule.delete({
      where: { id },
    });

    return { message: 'PM Schedule deleted successfully' };
  }

  async bulkRemove(ids: string[]) {
    const result = await this.prisma.pMSchedule.deleteMany({
      where: { id: { in: ids } },
    });
    return { message: `${result.count} PM Schedules deleted successfully` };
  }


  async addAttachment(pmScheduleId: string, file: Express.Multer.File) {
    const pm = await this.findOne(pmScheduleId);
    const userOrgId = TenancyContext.userOrgId;

    return this.prisma.pMScheduleFile.create({
      data: {
        pmScheduleId,
        filename: file.originalname,
        url: `/uploads/${file.filename}`,
        mimeType: file.mimetype,
        size: file.size,
        uploadedById: userOrgId,
      },
    });
  }

  async removeAttachment(pmScheduleId: string, fileId: string) {
    const file = await this.prisma.pMScheduleFile.findFirst({
      where: { id: fileId, pmScheduleId },
    });
    if (!file) {
      throw new NotFoundException('Attachment not found on this PM Strategy');
    }
    await this.prisma.pMScheduleFile.delete({ where: { id: fileId } });
    return { message: 'Attachment removed' };
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processSchedules() {
    await this.processDueSchedules();
    await this.processMeterSchedules();
  }

  async withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        return await operation();
      } catch (error: any) {
        attempt++;
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          ['P2028', 'P2034'].includes(error.code) &&
          attempt < maxRetries
        ) {
          const backoff = Math.pow(2, attempt) * 100;
          this.logger.warn(`Transaction failed (attempt ${attempt}), retrying in ${backoff}ms...`);
          await new Promise((resolve) => setTimeout(resolve, backoff));
        } else {
          throw error;
        }
      }
    }
    throw new Error('Transaction failed after maximum retries');
  }

  async processDueSchedules() {
    this.logger.log('Checking for due Time-based PM schedules...');
    const now = this.dateService.now();

    const activeSchedules = await this.prisma.pMSchedule.findMany({
      where: {
        isActive: true,
        status: 'ACTIVE',
        frequencyType: { in: ['DAYS', 'WEEKS', 'MONTHS', 'YEARS', 'HYBRID'] },
        nextDueDate: { lte: now },
        asset: {
          deletedAt: null,
          status: { notIn: ['DISPOSED' as any] },
        },
      },
      include: {
        plannedParts: true,
        plannedTasks: true,
        asset: {
          include: {
            location: true,
          },
        },
      },
    });

    let processed = 0;

    for (const schedule of activeSchedules) {
      // 1. SEASONALITY GUARD
      if (schedule.isSeasonal && schedule.startMonth && schedule.endMonth) {
        const currentMonth = now.getMonth() + 1;
        const inSeason =
          schedule.startMonth <= schedule.endMonth
            ? currentMonth >= schedule.startMonth &&
              currentMonth <= schedule.endMonth
            : currentMonth >= schedule.startMonth ||
              currentMonth <= schedule.endMonth;

        if (!inSeason) {
          const baseDate = (schedule.isFloating ? now : schedule.nextDueDate) as Date;
          const timezone = (schedule as any).asset?.location?.timezone || 'UTC';
          const localizedBase = this.dateService.toTimezone(baseDate, timezone);
          const localizedNext = this.dateService.calculateNextDueDate(
            localizedBase,
            schedule.frequencyType as any,
            schedule.frequencyValue!,
          );
          const localizedNextWithTime = this.applyTime(localizedNext, schedule.dueDateTime);
          const nextDueDate = this.dateService.toUTC(localizedNextWithTime, timezone);
          
          await this.prisma.pMSchedule.update({
            where: { id: schedule.id },
            data: { nextDueDate: nextDueDate },
          });
          continue;
        }
      }

      // 2. OVERDUE TRACKER
      if (schedule.nextDueDate && now > new Date(schedule.nextDueDate)) {
        await this.prisma.pMSchedule.update({
          where: { id: schedule.id },
          data: { overdueCount: { increment: 1 } },
        });
      }

      const advanceNoticeDays = schedule.advanceNoticeDays || 7;
      const triggerDate = new Date(schedule.nextDueDate!);
      triggerDate.setDate(triggerDate.getDate() - advanceNoticeDays);

      // 3. GENERATION TRIGGER
      if (now >= triggerDate) {
        try {
          await this.withRetry(async () => {
            await this.prisma.$transaction(async (tx) => {
              await this.generateWorkOrder(schedule, tx);

              const baseDate = (schedule.isFloating ? now : schedule.nextDueDate) as Date;
              
              const timezone = (schedule as any).asset?.location?.timezone || 'UTC';
              const localizedBase = this.dateService.toTimezone(baseDate, timezone);
              
              const localizedNext = this.dateService.calculateNextDueDate(
                localizedBase,
                schedule.frequencyType as any,
                schedule.frequencyValue!,
              );
              const localizedNextWithTime = this.applyTime(localizedNext, schedule.dueDateTime);
              const nextDueDate = this.dateService.toUTC(localizedNextWithTime, timezone);

              await tx.pMSchedule.update({
                where: { id: schedule.id },
                data: {
                  lastGenerated: now,
                  nextDueDate: nextDueDate,
                },
              });
            });
          });
          processed++;
        } catch (error: any) {
          this.logger.error(`Failed to generate WO for PM Schedule ${schedule.id}: ${error.message}`);
        }
      }
    }
    return processed;
  }

  async processMeterSchedules() {
    this.logger.log('Checking for due Meter-based PM schedules...');

    const meterSchedules = await this.prisma.pMSchedule.findMany({
      where: {
        isActive: true,
        status: 'ACTIVE',
        frequencyType: { in: ['METER', 'HYBRID'] },
        meterId: { not: null },
        asset: {
          deletedAt: null,
          status: { notIn: ['DISPOSED' as any] },
        },
      },
      include: { 
        meter: true,
        plannedParts: true,
        plannedTasks: true,
        asset: {
          include: { location: true }
        }
      },
    });

    let processed = 0;

    for (const schedule of meterSchedules) {
      const meterObj = (schedule as any).meter;
      if (!meterObj || schedule.nextMeterReading === null) continue;

      const currentValue = new Prisma.Decimal(meterObj.currentValue || 0);
      const nextMeterReading = schedule.nextMeterReading ? new Prisma.Decimal(schedule.nextMeterReading) : null;

      if (nextMeterReading && currentValue.gte(nextMeterReading)) {
        try {
          await this.withRetry(async () => {
            await this.prisma.$transaction(async (tx) => {
              await this.generateWorkOrder(schedule, tx);

              let nextReading: Prisma.Decimal | null = nextMeterReading;
              const triggerType = schedule.meterTriggerType || 'INTERVAL';

              if (triggerType === 'INTERVAL' || triggerType === 'RELATIVE') {
                nextReading = currentValue.plus(new Prisma.Decimal(schedule.meterInterval || 0));
              } else if (triggerType === 'THRESHOLD') {
                nextReading = null; 
              }

              await tx.pMSchedule.update({
                where: { id: schedule.id },
                data: {
                  lastGenerated: this.dateService.now(),
                  lastMeterReading: (schedule as any).meter.currentValue,
                  nextMeterReading: nextReading,
                  isActive: triggerType === 'THRESHOLD' ? false : schedule.isActive
                },
              });
            });
          });
          processed++;
        } catch (error: any) {
          this.logger.error(`Failed to generate meter WO for PM Schedule ${schedule.id}: ${error.message}`);
        }
      }
    }
    return processed;
  }

  private applyTime(dateObj: Date, timeStr?: string | null): Date {
    const d = new Date(dateObj);
    if (timeStr && typeof timeStr === 'string') {
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (match) {
        let hours = parseInt(match[1], 10);
        const mins = parseInt(match[2], 10);
        const ampm = match[3] ? match[3].toUpperCase() : null;
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        d.setHours(hours, mins, 0, 0);
      }
    }
    return d;
  }

  private async generateWorkOrder(schedule: any, tx: any = this.prisma) {
    let dueDate = schedule.nextDueDate ? new Date(schedule.nextDueDate) : new Date();
    if (!schedule.nextDueDate || schedule.frequencyType === 'METER') {
      dueDate = this.applyTime(dueDate, schedule.dueDateTime);
    }
    if (schedule.frequencyType === 'METER' && schedule.meterWODueValue) {
      const offset = schedule.meterWODueValue;
      dueDate = new Date();
      if (schedule.meterWODueUnit === 'HOURS') dueDate.setHours(dueDate.getHours() + offset);
      else if (schedule.meterWODueUnit === 'WEEKS') dueDate.setDate(dueDate.getDate() + offset * 7);
      else dueDate.setDate(dueDate.getDate() + offset); 
    }

    const workOrder = await tx.workOrder.create({
      data: {
        title: schedule.woTitle || `[PM] ${schedule.name}`,
        description: schedule.woDescription || schedule.description || 'Auto-generated Preventive Maintenance',
        priority: schedule.woPriority || 'MEDIUM',
        maintenanceType: 'PREVENTIVE',
        startDate: new Date(),
        dueDate: dueDate,
        assetId: schedule.assetId,
        locationId: schedule.asset?.locationId || null,
        organizationId: schedule.organizationId,
        assignedToId: schedule.assignedToId || null,
        checklistId: schedule.checklistId || null,
        status: 'OPEN',
        plannedParts: schedule.plannedParts?.length
          ? {
              create: schedule.plannedParts.map((p: any) => ({
                partId: p.partId,
                quantity: p.quantity,
                organizationId: schedule.organizationId,
              })),
            }
          : undefined,
        pmScheduleId: schedule.id,
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
      this.logger.error(`Failed to emit notification for PM generated WO: ${e.message}`);
    }

    return workOrder;
  }

  private async calculateInitialNextDueDate(
    assetId: string,
    startDateStr?: string | null,
    dueDateTimeStr?: string | null,
  ): Promise<Date | undefined> {
    if (!startDateStr) return undefined;

    let timezone = 'Asia/Kolkata'; // Default fallback
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
      include: { location: true },
    });
    if (asset?.location?.timezone) {
      timezone = asset.location.timezone;
    }

    const localizedBase = this.dateService.toTimezone(new Date(startDateStr), timezone);
    const localizedWithTime = this.applyTime(localizedBase, dueDateTimeStr);
    return this.dateService.toUTC(localizedWithTime, timezone);
  }
}
