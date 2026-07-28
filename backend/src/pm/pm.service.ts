import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FrequencyType } from '@prisma/client';
import { addDays, addWeeks, addMonths, addYears } from 'date-fns';

import { CreatePMScheduleDto } from './dto/create-pm-schedule.dto';
import { UpdatePMScheduleDto } from './dto/update-pm-schedule.dto';
import { TenancyContext } from '../common/tenancy.context';

@Injectable()
export class PMService {
  private readonly logger = new Logger(PMService.name);

  constructor(
    private prisma: PrismaService,
    @Inject('BullQueue_pm') private pmQueue: any,
  ) {}

  async findAll() {
    const organizationId = TenancyContext.organizationId;
    return this.prisma.pMSchedule.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        asset: { include: { location: true } },
        meter: true,
        checklist: true,
        category: true,
        assignedTo: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: CreatePMScheduleDto) {
    const organizationId = TenancyContext.organizationId || '';
    return this.prisma.pMSchedule.create({
      data: { ...data, organizationId },
    });
  }

  async update(id: string, data: UpdatePMScheduleDto) {
    return this.prisma.pMSchedule.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.pMSchedule.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Scans all active PM schedules and queues jobs for those due
   * Upgraded: Now respects the specific Timezone of the facility (Location).
   */
  async scanCalendarDueSchedules() {
    const { formatInTimeZone, toDate } = require('date-fns-tz');
    const nowUtc = new Date();
    
    // Buffer: We query schedules due within the next 14 hours to account for 
    // timezones that are ahead of UTC (like Kiribati at +14).
    const scanLimit = addDays(nowUtc, 1); 

    const batchSize = 100;
    let cursor: string | undefined = undefined;

    this.logger.log(`Starting global Timezone-Aware PM scan (UTC: ${nowUtc.toISOString()})...`);

    while (true) {
      const schedules = await this.prisma.pMSchedule.findMany({
        take: batchSize,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        where: {
          isActive: true,
          status: 'ACTIVE',
          nextDueDate: { lte: scanLimit },
          frequencyType: { not: null },
        },
        include: {
          asset: {
            select: {
              location: {
                select: { timezone: true }
              }
            }
          }
        }
      });

      if (schedules.length === 0) break;

      for (const schedule of schedules) {
        if (!schedule.nextDueDate) continue;

        // Facility Timezone Fallback (default to UTC or Organization default)
        const facilityTimezone = (schedule.asset as any)?.location?.timezone || 'UTC';
        
        // Calculate the "Current Time" in the facility's specific location
        // formatInTimeZone gives us a string representation of the time there.
        const localTimeStr = formatInTimeZone(nowUtc, facilityTimezone, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
        const localNow = new Date(localTimeStr);

        // Check if the due date (which is usually 00:00:00) has passed in local time
        if (schedule.nextDueDate <= localNow) {
          this.logger.debug(`Triggering PM ${schedule.name} for facility zone ${facilityTimezone}`);
          
          const dateBucket = schedule.nextDueDate.toISOString().slice(0, 10);
          const jobId = `pm-calendar-${schedule.id}-${dateBucket}`;

          await this.pmQueue.add(
            'generate-pm-workorder',
            {
              scheduleId: schedule.id,
              organizationId: schedule.organizationId,
              triggerType: 'CALENDAR',
              dateBucket,
            },
            { jobId },
          ).catch((err: any) => {
            // Ignore duplicate job error if job already queued by another instance
            this.logger.debug(`Job ${jobId} already enqueued: ${err.message}`);
          });
        }
      }

      cursor = schedules[schedules.length - 1].id;
      if (schedules.length < batchSize) break;
    }
    
    this.logger.log('Global PM scan completed.');
  }

  /**
   * Called when a new meter reading is recorded
   */
  async checkMeterTriggers(meterId: string, currentReading: number) {
    const schedules = await this.prisma.pMSchedule.findMany({
      where: {
        isActive: true,
        status: 'ACTIVE',
        meterId,
        nextMeterReading: { lte: currentReading },
      },
    });

    for (const schedule of schedules) {
      this.logger.log(
        `Meter trigger hit for ${schedule.name} at ${currentReading}`,
      );
      await this.pmQueue.add('generate-pm-workorder', {
        scheduleId: schedule.id,
        organizationId: schedule.organizationId,
        triggerType: 'METER',
        reading: currentReading,
      });
    }
  }

  calculateNextDueDate(
    baseDate: Date,
    type: FrequencyType,
    value: number,
  ): Date {
    switch (type) {
      case 'DAYS':
        return addDays(baseDate, value);
      case 'WEEKS':
        return addWeeks(baseDate, value);
      case 'MONTHS':
        return addMonths(baseDate, value);
      case 'YEARS':
        return addYears(baseDate, value);
      default:
        return baseDate;
    }
  }
}
