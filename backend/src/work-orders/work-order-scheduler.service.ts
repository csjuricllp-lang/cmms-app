import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenancyContext } from '../common/tenancy.context';
import { SmartScheduleDto } from './dto/smart-schedule.dto';
import { fromZonedTime } from 'date-fns-tz';

@Injectable()
export class WorkOrderSchedulerService {
  constructor(private prisma: PrismaService) {}

    async bulkUpdate(
    updates: { id: string; assignedToId?: string; startDate?: string | Date }[],
    isSmartSchedule: boolean = false,
    existingTx?: any
  ) {
    const organizationId = TenancyContext.organizationId;
    const role = TenancyContext.role;
    const results: any[] = [];

    // Vulnerability 3 Fix: IDOR / Privilege Escalation Prevention
    if (role && !['ADMIN', 'LIMITED_ADMIN', 'MANAGER'].includes(role)) {
      throw new BadRequestException('Insufficient permissions to perform bulk schedule updates.');
    }

    const runUpdates = async (tx: any) => {
      for (const update of updates) {
        let whereClause: any = {
          id: update.id,
          organizationId,
          deletedAt: null, // Fix 1: Never modify archived WOs
          status: { notIn: ['COMPLETED', 'CANCELLED'] }, // Fix 1: Never modify closed WOs
        };
        
        // Optimistic Concurrency Control (OCC) for Smart Schedule
        if (isSmartSchedule) {
          whereClause.assignedToId = null;
        }

        const res = await tx.workOrder.updateMany({
          where: whereClause,
          data: {
            assignedToId: update.assignedToId,
            startDate: update.startDate ? new Date(update.startDate) : undefined,
            version: { increment: 1 }, // Optimistic locking bump
          },
        });
        
        // Push raw ID to results if update succeeded
        if (res.count > 0) {
          results.push({ id: update.id, updated: true });
        } else if (!isSmartSchedule) {
          // If a manual bulk update fails (e.g. record not found), track failure
          results.push({ id: update.id, updated: false });
        }
      }
    };

    if (existingTx) {
      await runUpdates(existingTx);
    } else {
      await this.prisma.$transaction(runUpdates);
    }

    return results;
  }

  async smartSchedule(dto: SmartScheduleDto) {
    const organizationId = TenancyContext.organizationId;

    // Vulnerability 4 Fix: Organization-level Concurrency Lock
    return await this.prisma.$transaction(async (tx) => {
      // Obtain advisory lock on organization row to prevent overlapping technician assignments
      await tx.$executeRaw`SELECT id FROM "Organization" WHERE id = '${organizationId}' FOR UPDATE`;

      // Resolve start/end dates from DTO (supporting legacy "date" parameter)
    const startDateStr = dto.startDate || dto.date;
    if (!startDateStr) {
      throw new BadRequestException('Target date or startDate is required for scheduling.');
    }
    const endDateStr = dto.endDate || startDateStr;

    // Fix: Robust Date-Boundary Parsing using fromZonedTime
    const timezone = dto.timezone || 'UTC';
    
    // Extract purely the date string "YYYY-MM-DD"
    const datePart = startDateStr.split('T')[0];
    const endDatePart = endDateStr.split('T')[0];
    
    // Create Date objects representing midnight in the local timezone
    const localStart = new Date(`${datePart}T00:00:00`);
    const localEnd = new Date(`${endDatePart}T00:00:00`);

    // Convert local midnight to absolute UTC using the requested timezone
    const startGte = fromZonedTime(localStart, timezone);
    const endLt = fromZonedTime(new Date(localEnd.getTime() + 24 * 60 * 60 * 1000), timezone);

    // Vulnerability 1 Fix: Infinite Date Range DoS Prevention
    const maxDays = 90;
    const diffDays = Math.round((localEnd.getTime() - localStart.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > maxDays || diffDays < 0) {
      throw new BadRequestException(`Scheduling range cannot exceed ${maxDays} days and must be positive.`);
    }

    // Construct array of days in the range (DST-safe iteration)
    const daysRange: Date[] = [];
    for (let i = 0; i <= diffDays; i++) {
      // Safely add days to local time, then convert to UTC to avoid DST shift bugs
      const currentLocalDay = new Date(localStart.getTime() + (i * 24 * 60 * 60 * 1000));
      daysRange.push(fromZonedTime(currentLocalDay, timezone));
    }

    // Resolve shift times or default to 9:00 - 17:00 (to match the desktop scheduler)
    let startHour = 9;
    let endHour = 17;
    if (dto.shiftId) {
      const shift = await tx.shift.findFirst({
        where: { id: dto.shiftId, organizationId },
      });
      if (shift) {
        startHour = parseInt(shift.startTime.split(':')[0]) || 9;
        endHour = parseInt(shift.endTime.split(':')[0]) || 17;
      }
    }

    // Fetch target technicians (including their skills)
    const techFilter: Prisma.UserOrganizationWhereInput = {
      organizationId,
      user: { isActive: true, deletedAt: null }, // Scenario Fix: Technician disabled during scheduling → No new assignment
    };
    if (dto.technicianIds && dto.technicianIds.length > 0) {
      techFilter.id = { in: dto.technicianIds };
    }
    const technicians = await tx.userOrganization.findMany({
      where: techFilter,
      select: { id: true, skills: true, user: { select: { name: true } } },
      take: 500, // Vulnerability 3 Fix: Query Bounding for Technician Fetch
    });

    if (technicians.length === 0) {
      throw new BadRequestException('No technicians available for scheduling.');
    }

    // Fetch work orders to schedule
    let workOrdersToSchedule: any[] = [];
    if (dto.workOrderIds && dto.workOrderIds.length > 0) {
      workOrdersToSchedule = await tx.workOrder.findMany({
        where: {
          id: { in: dto.workOrderIds },
          organizationId,
          deletedAt: null,
          status: { notIn: ['COMPLETED', 'CANCELLED'] }, // Fix 2: Never schedule closed WOs
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      });
    } else {
      // Legacy or default: fetch all open unscheduled work orders
      workOrdersToSchedule = await tx.workOrder.findMany({
        where: {
          organizationId,
          status: 'OPEN',
          OR: [{ assignedToId: null }, { startDate: null }],
          deletedAt: null,
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        take: 500, // DoS Fix: Unbounded database-fetch bounded
      });
    }

    if (workOrdersToSchedule.length === 0) {
      return [];
    }

    // Fetch work orders already scheduled within the range to factor in existing workload
    const scheduledOnDays = await tx.workOrder.findMany({
      where: {
        organizationId,
        startDate: {
          gte: startGte,
          lt: endLt,
        },
        assignedToId: { in: technicians.map((t) => t.id) },
        deletedAt: null,
      },
      select: { assignedToId: true, estimatedHours: true, locationId: true, startDate: true },
      take: 5000, // DoS Fix: Unbounded scheduled-workload fetch bounded
    });

    const loadMap: Record<string, number> = {};
    const techLocationsPerDay: Record<string, Set<string>> = {};
    
    technicians.forEach((t) => {
      loadMap[t.id] = 0;
      for (let i = 0; i < daysRange.length; i++) {
        techLocationsPerDay[`${t.id}_${i}`] = new Set<string>();
      }
    });

    scheduledOnDays.forEach((wo) => {
      if (wo.assignedToId && loadMap[wo.assignedToId] !== undefined) {
        loadMap[wo.assignedToId] += Number(wo.estimatedHours) || 1;
        
        if (wo.locationId && wo.startDate) {
          const dayStart = new Date(wo.startDate);
          dayStart.setUTCHours(0, 0, 0, 0);
          const dayIdx = daysRange.findIndex((d) => d.getTime() === dayStart.getTime());
          if (dayIdx !== -1) {
            techLocationsPerDay[`${wo.assignedToId}_${dayIdx}`].add(wo.locationId);
          }
        }
      }
    });

    // Calculate actual shift duration (handles overnight shifts)
    const shiftDuration = (endHour >= startHour) ? (endHour - startHour) : ((24 - startHour) + endHour);

    // Allocate work orders in parallel across technicians' timelines
    const techCursors: Record<string, { dayIndex: number; hoursWorkedToday: number; totalLoad: number }> = {};
    technicians.forEach((t) => {
      techCursors[t.id] = {
        dayIndex: 0,
        hoursWorkedToday: 0,
        totalLoad: loadMap[t.id] || 0,
      };
    });

    const updates: { id: string; assignedToId: string; startDate: Date }[] = [];

    for (const wo of workOrdersToSchedule) {
      // 1. Skill-Based Filter: check required skill from category
      const requiredSkill = wo.category?.trim().toLowerCase();
      let qualifiedTechs = technicians;
      if (requiredSkill) {
        qualifiedTechs = technicians.filter((t) =>
          t.skills?.some((s: string) => s.trim().toLowerCase() === requiredSkill),
        );
        // Fallback if no matching skilled tech is available
        if (qualifiedTechs.length === 0) {
          qualifiedTechs = technicians;
        }
      }

      // 2. Proximity-Biased Load Selection
      const scoredTechs = qualifiedTechs.map((t) => {
        const cursor = techCursors[t.id];
        let score = cursor.totalLoad;
        
        // If technician is already assigned to this location on their current day, apply a 2-hour discount score
        const locationKey = `${t.id}_${cursor.dayIndex}`;
        if (wo.locationId && techLocationsPerDay[locationKey]?.has(wo.locationId)) {
          score -= 2; // Proximity bias discount
        }
        
        return { techId: t.id, score };
      }).sort((a, b) => a.score - b.score);

      const selectedTechId = scoredTechs[0].techId;
      const cursor = techCursors[selectedTechId];

      const woDuration = Math.max(Number(wo.estimatedHours) || 1, 0.01); // Fix 4: Reject zero/negative durations — floor at 0.01 to avoid infinite loops

      // Fix 7: Shift Overflow Check — pre-assignment guard
      // If this job won't fit in the remaining shift, advance cursor to next day FIRST
      const remainingShiftHours = shiftDuration - cursor.hoursWorkedToday;
      if (woDuration > remainingShiftHours && remainingShiftHours < shiftDuration) {
        cursor.hoursWorkedToday = 0;
        cursor.dayIndex = (cursor.dayIndex + 1) % daysRange.length;
      }

      const targetDay = daysRange[cursor.dayIndex] || daysRange[0];

      // Calculate actual hour of the day (wrapping around midnight)
      const absoluteHour = startHour + cursor.hoursWorkedToday;
      const actualHourOfDay = absoluteHour % 24;
      const dayOffset = Math.floor(absoluteHour / 24); // If shift crosses midnight, it adds +1 day

      // Construct schedule time using robust date math
      const scheduleTime = new Date(targetDay.getTime() + (dayOffset * 24 * 60 * 60 * 1000));
      scheduleTime.setUTCHours(actualHourOfDay, 0, 0, 0);

      updates.push({
        id: wo.id,
        assignedToId: selectedTechId,
        startDate: scheduleTime,
      });

      // Update cursor and location history
      cursor.totalLoad += woDuration;
      cursor.hoursWorkedToday += woDuration;
      if (wo.locationId) {
        techLocationsPerDay[`${selectedTechId}_${cursor.dayIndex}`]?.add(wo.locationId);
      }

      // If the technician's cursor hits or exceeds shift duration, move to the next shift day
      if (cursor.hoursWorkedToday >= shiftDuration) {
        cursor.hoursWorkedToday = 0;
        cursor.dayIndex = (cursor.dayIndex + 1) % daysRange.length;
      }
    }
    return this.bulkUpdate(updates, true, tx); // Pass flag and transaction for OCC
    });
  }
}
