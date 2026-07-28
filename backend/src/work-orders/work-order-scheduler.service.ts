import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenancyContext } from '../common/tenancy.context';
import { SmartScheduleDto } from './dto/smart-schedule.dto';

@Injectable()
export class WorkOrderSchedulerService {
  constructor(private prisma: PrismaService) {}

  async bulkUpdate(updates: { id: string; assignedToId?: string; startDate?: string | Date }[]) {
    const organizationId = TenancyContext.organizationId;
    const results: any[] = [];

    await this.prisma.$transaction(async (tx: any) => {
      for (const update of updates) {
        const res = await tx.workOrder.update({
          where: { id: update.id, organizationId },
          data: {
            assignedToId: update.assignedToId,
            startDate: update.startDate ? new Date(update.startDate) : undefined,
          },
        });
        results.push(res);
      }
    });

    return results;
  }

  async smartSchedule(dto: SmartScheduleDto) {
    const organizationId = TenancyContext.organizationId;

    // Resolve start/end dates from DTO (supporting legacy "date" parameter)
    const startDateStr = dto.startDate || dto.date;
    if (!startDateStr) {
      throw new BadRequestException('Target date or startDate is required for scheduling.');
    }
    const endDateStr = dto.endDate || startDateStr;

    // Boundary parsing to prevent timezone offset shifts
    const datePart = startDateStr.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    const startGte = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));

    const endDatePart = endDateStr.split('T')[0];
    const [endYear, endMonth, endDay] = endDatePart.split('-').map(Number);
    const endLt = new Date(Date.UTC(endYear, endMonth - 1, endDay + 1, 0, 0, 0));

    // Construct array of days in the range
    const daysRange: Date[] = [];
    const tempDate = new Date(startGte);
    while (tempDate < endLt) {
      daysRange.push(new Date(tempDate));
      tempDate.setUTCDate(tempDate.getUTCDate() + 1);
    }

    // Resolve shift times or default to 9:00 - 17:00 (to match the desktop scheduler)
    let startHour = 9;
    let endHour = 17;
    if (dto.shiftId) {
      const shift = await this.prisma.shift.findFirst({
        where: { id: dto.shiftId, organizationId },
      });
      if (shift) {
        startHour = parseInt(shift.startTime.split(':')[0]) || 9;
        endHour = parseInt(shift.endTime.split(':')[0]) || 17;
      }
    }

    // Fetch target technicians (including their skills)
    const techFilter: Prisma.UserOrganizationWhereInput = { organizationId };
    if (dto.technicianIds && dto.technicianIds.length > 0) {
      techFilter.id = { in: dto.technicianIds };
    }
    const technicians = await this.prisma.userOrganization.findMany({
      where: techFilter,
      select: { id: true, skills: true, user: { select: { name: true } } },
    });

    if (technicians.length === 0) {
      throw new BadRequestException('No technicians available for scheduling.');
    }

    // Fetch work orders to schedule
    let workOrdersToSchedule: any[] = [];
    if (dto.workOrderIds && dto.workOrderIds.length > 0) {
      workOrdersToSchedule = await this.prisma.workOrder.findMany({
        where: {
          id: { in: dto.workOrderIds },
          organizationId,
          deletedAt: null,
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      });
    } else {
      // Legacy or default: fetch all open unscheduled work orders
      workOrdersToSchedule = await this.prisma.workOrder.findMany({
        where: {
          organizationId,
          status: 'OPEN',
          OR: [{ assignedToId: null }, { startDate: null }],
          deletedAt: null,
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      });
    }

    if (workOrdersToSchedule.length === 0) {
      return [];
    }

    // Fetch work orders already scheduled within the range to factor in existing workload
    const scheduledOnDays = await this.prisma.workOrder.findMany({
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

    // Allocate work orders in parallel across technicians' timelines
    const techCursors: Record<string, { dayIndex: number; currentHour: number; totalLoad: number }> = {};
    technicians.forEach((t) => {
      techCursors[t.id] = {
        dayIndex: 0,
        currentHour: startHour,
        totalLoad: loadMap[t.id],
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

      const woDuration = Number(wo.estimatedHours) || 1;
      const targetDay = daysRange[cursor.dayIndex] || daysRange[0];

      // Construct schedule time in UTC
      const scheduleTime = new Date(targetDay);
      scheduleTime.setUTCHours(cursor.currentHour, 0, 0, 0);

      updates.push({
        id: wo.id,
        assignedToId: selectedTechId,
        startDate: scheduleTime,
      });

      // Update cursor and location history
      cursor.totalLoad += woDuration;
      cursor.currentHour += woDuration;
      if (wo.locationId) {
        techLocationsPerDay[`${selectedTechId}_${cursor.dayIndex}`]?.add(wo.locationId);
      }

      // If the technician's cursor goes beyond the end hour, move them to the next day
      if (cursor.currentHour >= endHour) {
        cursor.currentHour = startHour;
        cursor.dayIndex = (cursor.dayIndex + 1) % daysRange.length;
      }
    }
    return this.bulkUpdate(updates);
  }
}
