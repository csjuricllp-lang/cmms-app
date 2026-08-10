import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenancyContext } from '../common/tenancy.context';
import { Prisma } from '@prisma/client';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { SLAService } from '../sla/sla.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    private slaService: SLAService,
  ) {}

  async getDashboardStats(organizationId: string, filters?: any) {
    const timezone = filters?.timezone || 'UTC';
    const assetWhere = this.buildWhere(organizationId, filters);
    const woWhere = this.buildWOWhere(organizationId, filters);
    const partWhere = this.buildPartWhere(organizationId, filters);

    const requestWhere = this.buildRequestWhere(organizationId, filters);
    const userWhere = { organizationId }; // Users are generally not filtered by asset/location for these counts
    const locationWhere = { organizationId, deletedAt: null };

    const thirtyDaysAgo = this.getDateRangeCondition(filters?.dateRange, timezone)?.gte || fromZonedTime(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), timezone);

    const [
      totalAssets,
      totalWorkOrders,
      totalRequests,
      totalUsers,
      totalLocations,
    ] = await Promise.all([
      this.prisma.asset.count({ where: assetWhere }),
      this.prisma.workOrder.count({ where: woWhere }),
      this.prisma.maintenanceRequest.count({ where: requestWhere }),
      this.prisma.userOrganization.count({ where: userWhere }),
      this.prisma.location.count({ where: locationWhere }),
    ]);

    const workOrderStatus = await this.prisma.workOrder.groupBy({
      where: woWhere,
      by: ['status'],
      _count: true,
    });

    const assetStatus = await this.prisma.asset.groupBy({
      where: assetWhere,
      by: ['status'],
      _count: true,
    });

    // MTTR Calculation - respect filters
    const completedWOs = await this.prisma.workOrder.findMany({
      where: {
        ...woWhere,
        status: 'COMPLETED',
        completedAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true, completedAt: true, dueDate: true },
    });

    let totalRepairTimeMs = 0;
    let onTimeCompletions = 0;
    completedWOs.forEach((wo: any) => {
      const start = new Date(wo.createdAt).getTime();
      const end = new Date(wo.completedAt).getTime();
      totalRepairTimeMs += end - start;

      if (wo.dueDate && new Date(wo.completedAt) <= new Date(wo.dueDate)) {
        onTimeCompletions++;
      }
    });

    const mttrHours =
      completedWOs.length > 0
        ? (totalRepairTimeMs / completedWOs.length / (1000 * 60 * 60)).toFixed(
            2,
          )
        : 0;

    // --- 0.5 Mean Waiting Time (MWT) ---
    // Exclude PMs by default as requested.
    const startedWOs = await this.prisma.workOrder.findMany({
      where: {
        ...woWhere,
        maintenanceType: { not: 'PREVENTIVE' },
        startDate: { not: null },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true, startDate: true },
    });

    const mwtHours = this.slaService.calculateMWT(startedWOs);

    // MWT Trend for the last 6 months
    const last6MonthsMWT = [0, 1, 2, 3, 4, 5].map(i => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return {
        name: date.toLocaleString('default', { month: 'short' }),
        start: new Date(date.getFullYear(), date.getMonth(), 1),
        end: new Date(date.getFullYear(), date.getMonth() + 1, 0),
        workOrders: [] as any[]
      };
    });

    const mwtStartedWOsFor6Months = await this.prisma.workOrder.findMany({
      where: {
        ...woWhere,
        maintenanceType: { not: 'PREVENTIVE' },
        startDate: { not: null },
        createdAt: { gte: last6MonthsMWT[0].start }
      },
      select: { createdAt: true, startDate: true }
    });

    mwtStartedWOsFor6Months.forEach((wo: any) => {
      const createdDate = new Date(wo.createdAt);
      const month = last6MonthsMWT.find(m => createdDate >= m.start && createdDate <= m.end);
      if (month) {
        month.workOrders.push(wo);
      }
    });

    const mwtTrend = last6MonthsMWT.map(m => ({
      name: m.name,
      value: this.slaService.calculateMWT(m.workOrders as any)
    }));

    // --- 1. PM Compliance Rate ---
    const [scheduledPMs, completedPMs] = await Promise.all([
      this.prisma.workOrder.count({
        where: {
          ...woWhere,
          maintenanceType: 'PREVENTIVE',
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.workOrder.count({
        where: {
          ...woWhere,
          maintenanceType: 'PREVENTIVE',
          status: 'COMPLETED',
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
    ]);
    const pmComplianceRate =
      scheduledPMs > 0 ? ((completedPMs / scheduledPMs) * 100).toFixed(1) : 100;

    // --- 2. Asset Availability (Uptime) ---
    const assets = await this.prisma.asset.findMany({
      where: assetWhere,
      select: { 
        totalDowntimeMinutes: true, 
        createdAt: true, 
        id: true, 
        name: true,
        category: true, 
        status: true, 
        locationId: true, 
        location: { select: { name: true } },
        purchasePrice: true,
        purchaseDate: true,
        warrantyExpiry: true,
        usefulLifeYears: true,
        placedInServiceDate: true,
        pmSchedules: { select: { id: true } }
      },
    });
    let totalUptimeMinutes = 0;
    let totalPossibleMinutes = 0;
    assets.forEach((asset: any) => {
      const ageMinutes = Math.floor(
        (Date.now() - new Date(asset.createdAt).getTime()) / 60000,
      );
      totalPossibleMinutes += ageMinutes;
      totalUptimeMinutes += ageMinutes - (asset.totalDowntimeMinutes || 0);
    });
    const assetAvailability =
      totalPossibleMinutes > 0
        ? ((totalUptimeMinutes / totalPossibleMinutes) * 100).toFixed(1)
        : 100;

    // --- 3. Inventory Value ---
    const parts = await this.prisma.part.findMany({
      where: { organizationId, deletedAt: null }, // Inventory is usually global per org
      select: { quantity: true, cost: true },
    });
    const totalStockValue = parts.reduce(
      (acc: number, p: any) => acc + (p.quantity || 0) * (p.cost || 0),
      0,
    );

    // --- 4. WO Cost Breakdown ---
    const costs = await this.prisma.workOrder.aggregate({
      where: woWhere,
      _sum: { laborCost: true, partsCost: true, totalCost: true },
    });

    // --- 5. MTBF Calculation ---
    const totalFailures = await this.prisma.workOrder.count({
      where: {
        ...woWhere,
        maintenanceType: 'REACTIVE',
        createdAt: { gte: thirtyDaysAgo },
      },
    });
    const mttfHoursStr =
      totalFailures > 0
        ? (totalUptimeMinutes / 60 / totalFailures).toFixed(2)
        : "0.00";
    const mttfHours = parseFloat(mttfHoursStr);
    const mtbfHours = mttfHours + parseFloat(mttrHours as string);

    // --- 6. Parts Consumption Analytics (NEW) ---
    const topPartsByUsage = await this.prisma.workOrderPart.groupBy({
      where: { workOrder: { organizationId, createdAt: { gte: thirtyDaysAgo } } },
      by: ['partId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    const hydratedTopByUsage = await Promise.all(
      topPartsByUsage.map(async (item: any) => {
        const part = await this.prisma.part.findUnique({ where: { id: item.partId }, select: { name: true } });
        return { name: part?.name || 'Unknown', usage: item._sum.quantity, unit: 'pcs' };
      })
    );

    const topPartsByCost = await this.prisma.workOrderPart.groupBy({
      where: { workOrder: { organizationId, createdAt: { gte: thirtyDaysAgo } } },
      by: ['partId'],
      _sum: { totalCost: true },
      orderBy: { _sum: { totalCost: 'desc' } },
      take: 5,
    });

    const hydratedTopByCost = await Promise.all(
      topPartsByCost.map(async (item: any) => {
        const part = await this.prisma.part.findUnique({ where: { id: item.partId }, select: { name: true } });
        return { name: part?.name || 'Unknown', cost: item._sum.totalCost };
      })
    );

    const allPartsForStock = await this.prisma.part.findMany({
      where: { organizationId, deletedAt: null },
      select: { id: true, name: true, quantity: true, minQuantity: true },
    });

    const lowStockParts = allPartsForStock
      .filter((p: any) => (p.quantity || 0) <= (p.minQuantity || 0))
      .slice(0, 10);

    const lowStockCount = allPartsForStock
      .filter((p: any) => (p.quantity || 0) <= (p.minQuantity || 0))
      .length;

    const uniquePartsCount = await this.prisma.workOrderPart.groupBy({
      where: { workOrder: { organizationId, createdAt: { gte: thirtyDaysAgo } } },
      by: ['partId'],
    }).then((res: any[]) => res.length);

    // --- 7. Monthly Trend ---
    const last3Months = [0, 1, 2].map((i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return {
        month: date.toLocaleString('default', { month: 'short' }),
        start: new Date(date.getFullYear(), date.getMonth(), 1),
        end: new Date(date.getFullYear(), date.getMonth() + 1, 0),
      };
    }).reverse();

    const monthlyTrend = await Promise.all(
      last3Months.map(async (m) => {
        const [created, completed] = await Promise.all([
          this.prisma.workOrder.count({
            where: { organizationId, createdAt: { gte: m.start, lte: m.end } },
          }),
          this.prisma.workOrder.count({
            where: { organizationId, completedAt: { gte: m.start, lte: m.end }, status: 'COMPLETED' },
          }),
        ]);
        return { name: m.month, created, completed };
      }),
    );

    // --- 8. Top Technicians ---
    const technicianStats = await this.prisma.workOrder.groupBy({
      where: { ...woWhere, status: 'COMPLETED' },
      by: ['assignedToId'],
      _count: true,
      orderBy: { _count: { assignedToId: 'desc' } },
      take: 5,
    });

    const topTechnicians = await Promise.all(
      technicianStats.map(async (stat: any) => {
        if (!stat.assignedToId) return { name: 'Unassigned', count: stat._count };
        const userOrg = await this.prisma.userOrganization.findUnique({
          where: { id: stat.assignedToId },
          include: { user: { select: { name: true } } },
        });
        return {
          name: userOrg?.user?.name || 'Unknown',
          count: stat._count,
          userOrgId: stat.assignedToId,
          avatar: (userOrg?.user?.name || 'U').split(' ').map((n: any) => n[0]).join('').toUpperCase(),
        };
      }),
    );

    // --- 9. Top Locations ---
    const locationStats = await this.prisma.workOrder.groupBy({
      where: { ...woWhere, status: 'COMPLETED' },
      by: ['locationId'],
      _count: true,
      orderBy: { _count: { locationId: 'desc' } },
      take: 5,
    });

    const topLocations = await Promise.all(
      locationStats.map(async (stat: any) => {
        if (!stat.locationId) return { name: 'No Location', count: stat._count };
        const location = await this.prisma.location.findUnique({
          where: { id: stat.locationId },
          select: { name: true },
        });
        return {
          name: location?.name || 'Unknown',
          count: stat._count,
        };
      }),
    );

    // --- 10. Backlog ---
    const openWOs = await this.prisma.workOrder.findMany({
      where: { ...woWhere, status: { in: ['OPEN', 'ON_HOLD', 'IN_PROGRESS'] } },
      select: { priority: true, maintenanceType: true, deferredUntilDate: true },
    });

    const backlog = {
      priority: {
        HIGH: openWOs.filter((wo: any) => wo.priority === 'HIGH').length,
        MEDIUM: openWOs.filter((wo: any) => wo.priority === 'MEDIUM').length,
        LOW: openWOs.filter((wo: any) => wo.priority === 'LOW').length,
      },
      type: {
        PREVENTIVE: openWOs.filter((wo: any) => wo.maintenanceType === 'PREVENTIVE').length,
        REACTIVE: openWOs.filter((wo: any) => wo.maintenanceType === 'REACTIVE').length,
      },
      deferred: openWOs.filter((wo: any) => !!wo.deferredUntilDate).length,
      total: openWOs.length,
    };

    // --- 11. Maintenance Type Mix ---
    const typeMixStats = await this.prisma.workOrder.groupBy({
      where: woWhere,
      by: ['maintenanceType'],
      _count: true,
    });

    const typeMix = typeMixStats.map((stat: any) => ({
      name: stat.maintenanceType === 'PREVENTIVE' ? 'Preventive' : 'Reactive',
      value: stat._count,
      color: stat.maintenanceType === 'PREVENTIVE' ? '#4F46E5' : '#F43F5E',
    }));

    // --- 12. Cost Overview & Trends ---
    const workOrdersForCosts = await this.prisma.workOrder.findMany({
      where: woWhere,
      select: { laborCost: true, partsCost: true, additionalCost: true, totalCost: true, createdAt: true, maintenanceType: true, assetId: true, locationId: true, category: true },
    });

    const costStats = {
      labor: workOrdersForCosts.reduce((acc: Prisma.Decimal, wo: any) => acc.plus(new Prisma.Decimal(wo.laborCost || 0)), new Prisma.Decimal(0)).toNumber(),
      parts: workOrdersForCosts.reduce((acc: Prisma.Decimal, wo: any) => acc.plus(new Prisma.Decimal(wo.partsCost || 0)), new Prisma.Decimal(0)).toNumber(),
      other: workOrdersForCosts.reduce((acc: Prisma.Decimal, wo: any) => acc.plus(new Prisma.Decimal(wo.additionalCost || 0)), new Prisma.Decimal(0)).toNumber(),
      total: workOrdersForCosts.reduce((acc: Prisma.Decimal, wo: any) => acc.plus(new Prisma.Decimal(wo.totalCost || 0)), new Prisma.Decimal(0)).toNumber(),
    };

    const weeklyCosts = [0, 1, 2, 3].map((i) => {
      const start = new Date();
      start.setDate(start.getDate() - (i + 1) * 7);
      const end = new Date();
      end.setDate(end.getDate() - i * 7);
      const WOsInWeek = workOrdersForCosts.filter((wo: any) => { const d = new Date(wo.createdAt); return d >= start && d <= end; });
      const downtimeWOsInWeek = WOsInWeek.filter((wo: any) => wo.isDowntimeEvent);
      const downtimeHours = downtimeWOsInWeek.reduce((acc: number, wo: any) => acc + (wo.downtimeMinutes || 0), 0) / 60;
      return { 
        name: `Week -${i}`, 
        cost: WOsInWeek.reduce((acc: Prisma.Decimal, wo: any) => acc.plus(new Prisma.Decimal(wo.totalCost || 0)), new Prisma.Decimal(0)).toNumber(),
        avgCost: WOsInWeek.length > 0 ? WOsInWeek.reduce((acc: Prisma.Decimal, wo: any) => acc.plus(new Prisma.Decimal(wo.totalCost || 0)), new Prisma.Decimal(0)).div(WOsInWeek.length).toNumber() : 0,
        downtimeHours: Number(downtimeHours.toFixed(1))
      };
    }).reverse();

    const totalPurchasePriceObj = await this.prisma.asset.aggregate({
      where: assetWhere,
      _sum: { purchasePrice: true }
    });
    const totalPurchasePrice = totalPurchasePriceObj._sum.purchasePrice ? Number(totalPurchasePriceObj._sum.purchasePrice) : 0;
    const costAsPctOfRav = totalPurchasePrice > 0 ? ((costStats.total / totalPurchasePrice) * 100).toFixed(2) : "0.00";

    const assetBreakout = await this.prisma.workOrder.groupBy({
      where: { ...woWhere, totalCost: { gt: 0 } },
      by: ['assetId'],
      _sum: { totalCost: true },
      orderBy: { _sum: { totalCost: 'desc' } },
      take: 5,
    });

    const hydratedAssetBreakout = await Promise.all(
      assetBreakout.map(async (item: any) => {
        if (!item.assetId) return { name: 'None', value: item._sum.totalCost };
        const asset = await this.prisma.asset.findUnique({ where: { id: item.assetId }, select: { name: true } });
        return { name: asset?.name || 'Unknown', value: item._sum.totalCost };
      })
    );

    const categoryBreakout = await this.prisma.workOrder.groupBy({
      where: { ...woWhere, totalCost: { gt: 0 } },
      by: ['category'],
      _sum: { totalCost: true },
      orderBy: { _sum: { totalCost: 'desc' } },
    });

    const locationBreakout = await this.prisma.workOrder.groupBy({
      where: { ...woWhere, totalCost: { gt: 0 } },
      by: ['locationId'],
      _sum: { totalCost: true },
      orderBy: { _sum: { totalCost: 'desc' } },
      take: 5,
    });

    const hydratedLocationBreakout = await Promise.all(
      locationBreakout.map(async (item: any) => {
        if (!item.locationId) return { name: 'None', value: item._sum.totalCost };
        const location = await this.prisma.location.findUnique({ where: { id: item.locationId }, select: { name: true } });
        return { name: location?.name || 'Unknown', value: item._sum.totalCost };
      })
    );

    const reactiveWOs = workOrdersForCosts.filter((wo: any) => wo.maintenanceType === 'REACTIVE');
    const preventiveWOs = workOrdersForCosts.filter((wo: any) => wo.maintenanceType === 'PREVENTIVE');
    const avgCosts = {
      reactive: reactiveWOs.length > 0 ? reactiveWOs.reduce((acc: Prisma.Decimal, wo: any) => acc.plus(new Prisma.Decimal(wo.totalCost || 0)), new Prisma.Decimal(0)).div(reactiveWOs.length).toNumber() : 0,
      preventive: preventiveWOs.length > 0 ? preventiveWOs.reduce((acc: Prisma.Decimal, wo: any) => acc.plus(new Prisma.Decimal(wo.totalCost || 0)), new Prisma.Decimal(0)).div(preventiveWOs.length).toNumber() : 0,
      all: workOrdersForCosts.length > 0 ? new Prisma.Decimal(costStats.total).div(workOrdersForCosts.length).toNumber() : 0,
    };

    // --- 13. Asset Downtime & Utilization ---
    const totalPeriodMinutes = 30 * 24 * 60;
    const totalPossibleMinutesAll = assets.length * totalPeriodMinutes;
    const totalDowntimeMinsAll = assets.reduce((acc: number, a: any) => acc + (a.totalDowntimeMinutes || 0), 0);
    const overallUtilization = totalPossibleMinutesAll > 0 ? (((totalPossibleMinutesAll - totalDowntimeMinsAll) / totalPossibleMinutesAll) * 100).toFixed(1) : "100.0";

    const operationalStatusStats = {
      operational: assets.filter(a => a.status === 'OPERATIONAL').length,
      nonOperational: assets.filter(a => a.status !== 'OPERATIONAL').length,
    };

    const topAssetsDowntime = await Promise.all(
      assets.sort((a: any, b: any) => (b.totalDowntimeMinutes || 0) - (a.totalDowntimeMinutes || 0)).slice(0, 10).map(async (a: any) => {
        const eventsCount = await this.prisma.workOrder.count({ where: { assetId: a.id, isDowntimeEvent: true, createdAt: { gte: thirtyDaysAgo } } });
        const costAgg = await this.prisma.workOrder.aggregate({
          where: { assetId: a.id, status: 'COMPLETED', organizationId },
          _sum: { totalCost: true }
        });
        const maintenanceCost = costAgg._sum.totalCost ? Number(costAgg._sum.totalCost) : 0;
        return { 
          id: a.id, 
          name: a.name, 
          location: (a as any).location?.name || 'Unknown', 
          status: a.status, 
          downtimeHours: ((a.totalDowntimeMinutes || 0) / 60).toFixed(1), 
          events: eventsCount, 
          utilization: totalPeriodMinutes > 0 ? (((totalPeriodMinutes - (a.totalDowntimeMinutes || 0)) / totalPeriodMinutes) * 100).toFixed(1) : "100.0",
          maintenanceCost
        };
      })
    );

    const locationUtilData = await Promise.all((await this.prisma.location.findMany({ where: { organizationId }, select: { id: true, name: true } })).map(async (loc: any) => {
      const locAssets = assets.filter(a => a.locationId === loc.id);
      if (locAssets.length === 0) return { name: loc.name, value: 100 };
      const locPossible = locAssets.length * totalPeriodMinutes;
      const locDowntime = locAssets.reduce((acc: number, a: any) => acc + (a.totalDowntimeMinutes || 0), 0);
      return { name: loc.name, value: Number(((locPossible - locDowntime) / locPossible * 100).toFixed(1)) };
    }));

    const categoriesList = [...new Set(assets.map(a => a.category).filter(Boolean))];
    const categoryUtilData = categoriesList.map(cat => {
      const catAssets = assets.filter(a => a.category === cat);
      const catPossible = catAssets.length * totalPeriodMinutes;
      const catDowntime = catAssets.reduce((acc: number, a: any) => acc + (a.totalDowntimeMinutes || 0), 0);
      return { name: cat || 'Uncategorized', value: Number(((catPossible - catDowntime) / catPossible * 100).toFixed(1)) };
    });

    const last7DaysUtil = [0, 1, 2, 3, 4, 5, 6].map(i => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        dateStr: date.toISOString().split('T')[0],
        name: date.toLocaleDateString(undefined, { weekday: 'short' }),
        downtimeMins: 0,
        events: 0
      };
    });

    const dailyDowntime = await this.prisma.workOrder.findMany({
      where: {
        ...woWhere,
        isDowntimeEvent: true,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      select: { createdAt: true, downtimeMinutes: true }
    });

    dailyDowntime.forEach((wo: any) => {
      const woDateStr = new Date(wo.createdAt).toISOString().split('T')[0];
      const day = last7DaysUtil.find(d => d.dateStr === woDateStr);
      if (day) {
        day.downtimeMins += (wo.downtimeMinutes || 0);
        day.events += 1;
      }
    });

    const totalAssetsCount = assets.length || 1;
    const possibleMinsPerDay = totalAssetsCount * 24 * 60;

    const utilizationOverTime = last7DaysUtil.map(d => {
      const uptime = possibleMinsPerDay - d.downtimeMins;
      const value = Math.max(0, Math.min(100, Number((uptime / possibleMinsPerDay * 100).toFixed(1))));
      return {
        name: d.name,
        value
      };
    });

    const downtimeHistory = last7DaysUtil.map(d => ({
      name: d.name,
      events: d.events
    }));

    // --- 14. Adoption Metrics (NEW) ---
    const [totalWOsCreated, totalWOsCompleted] = await Promise.all([
      this.prisma.workOrder.count({ where: woWhere }),
      this.prisma.workOrder.count({ where: { ...woWhere, status: 'COMPLETED' } }),
    ]);

    const completionPercentage = totalWOsCreated > 0 ? ((totalWOsCompleted / totalWOsCreated) * 100).toFixed(1) : "0.0";
    const onTimePercentage = totalWOsCompleted > 0 ? ((onTimeCompletions / totalWOsCompleted) * 100).toFixed(1) : "0.0";

    const wosHealth = await this.prisma.workOrder.findMany({
      where: woWhere,
      select: { category: true, dueDate: true, assetId: true, locationId: true, checklistId: true, status: true, maintenanceType: true }
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeUsersCount = await this.prisma.userOrganization.count({
      where: {
        organizationId,
        user: { lastActiveAt: { gte: sevenDaysAgo } }
      }
    });

    const adoptionStats = {
      health: {
        completionPercentage,
        onTimePercentage,
        pieCharts: {
          hasCategory: { yes: wosHealth.filter((w: any) => !!w.category).length, no: wosHealth.filter((w: any) => !w.category).length },
          hasDueDate: { yes: wosHealth.filter((w: any) => !!w.dueDate).length, no: wosHealth.filter((w: any) => !w.dueDate).length },
          hasAsset: { yes: wosHealth.filter((w: any) => !!w.assetId).length, no: wosHealth.filter((w: any) => !w.assetId).length },
          hasLocation: { yes: wosHealth.filter((w: any) => !!w.locationId).length, no: wosHealth.filter((w: any) => !w.locationId).length },
        }
      },
      pmHealth: {
        reactiveVsRecurring: { reactive: wosHealth.filter((w: any) => w.maintenanceType === 'REACTIVE').length, recurring: wosHealth.filter((w: any) => w.maintenanceType === 'PREVENTIVE').length },
        assetCoverage: { covered: assets.filter((a: any) => (a as any).pmSchedules?.length > 0).length, notCovered: assets.filter((a: any) => !(a as any).pmSchedules?.length).length }
      },
      userAdoption: {
        activeUsersLast7Days: activeUsersCount,
        requestVolume: await Promise.all(last3Months.map(async (m) => ({ name: m.month, value: await this.prisma.maintenanceRequest.count({ where: { organizationId, createdAt: { gte: m.start, lte: m.end } } }) })))
      },
      timeReport: {
        percentWithTime: (await this.prisma.workOrder.count({ where: { ...woWhere, timeLogs: { some: {} } } }) / (totalWOsCreated || 1) * 100).toFixed(1),
        workerTable: await Promise.all(topTechnicians.slice(0, 5).map(async (t: any) => {
          const hoursLogs = await this.prisma.workOrderTimeLog.aggregate({ 
            where: { 
              userId: t.userOrgId, 
              workOrder: woWhere
            }, 
            _sum: { hoursLogged: true } 
          });
          const lastLog = await this.prisma.workOrderTimeLog.findFirst({
            where: { userId: t.userOrgId },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true }
          });
          const lastLogged = lastLog?.createdAt
            ? new Date(lastLog.createdAt).toLocaleDateString('default', { month: 'short', day: 'numeric' })
            : 'Never';
          return { name: t.name, lastLogged, totalTime: hoursLogs._sum?.hoursLogged || 0, woCount: t.count };
        }))
      },
      availableLocations: await this.prisma.location.findMany({ where: { organizationId, deletedAt: null }, select: { id: true, name: true } })
    };

    // Calculate Compliance Metrics
    const filterCategories = filters?.categories ? (Array.isArray(filters.categories) ? filters.categories : [filters.categories]) : null;
    const locations = filters?.locations ? (Array.isArray(filters.locations) ? filters.locations : [filters.locations]) : null;
    const assetsFilter = filters?.assets ? (Array.isArray(filters.assets) ? filters.assets : [filters.assets]) : null;
    const teamsFilter = filters?.teams ? (Array.isArray(filters.teams) ? filters.teams : [filters.teams]) : null;
    const type = filters?.type && filters.type !== 'any value' ? filters.type : null;

    const complianceCompletedWOs = await this.prisma.workOrder.findMany({
      where: { ...woWhere, status: 'COMPLETED' },
      select: { id: true, dueDate: true, completedAt: true, priority: true, estimatedHours: true }
    });

    const compliantCount = complianceCompletedWOs.filter((wo: any) => !wo.dueDate || new Date(wo.completedAt) <= new Date(wo.dueDate)).length;
    
    const priorityCounts = complianceCompletedWOs.reduce((acc: any, wo: any) => {
      acc[wo.priority] = (acc[wo.priority] || 0) + 1;
      return acc;
    }, {});

    const last6MonthsCompliance = [0, 1, 2, 3, 4, 5].map(i => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return {
        name: date.toLocaleString('default', { month: 'short' }),
        start: new Date(date.getFullYear(), date.getMonth(), 1),
        end: new Date(date.getFullYear(), date.getMonth() + 1, 0),
        total: 0,
        compliant: 0
      };
    });

    const completedWOsFor6Months = await this.prisma.workOrder.findMany({
      where: {
        ...woWhere,
        status: 'COMPLETED',
        completedAt: {
          gte: last6MonthsCompliance[0].start
        }
      },
      select: { completedAt: true, dueDate: true }
    });

    completedWOsFor6Months.forEach((wo: any) => {
      const compDate = new Date(wo.completedAt);
      const isCompliant = !wo.dueDate || compDate <= new Date(wo.dueDate);
      const month = last6MonthsCompliance.find(m => compDate >= m.start && compDate <= m.end);
      if (month) {
        month.total++;
        if (isCompliant) {
          month.compliant++;
        }
      }
    });

    const complianceMonthlyTrend = last6MonthsCompliance.map(m => ({
      name: m.name,
      rate: m.total > 0 ? Number(((m.compliant / m.total) * 100).toFixed(1)) : 100
    }));

    const complianceMetrics = {
      summary: {
        total: complianceCompletedWOs.length,
        compliant: compliantCount,
        nonCompliant: complianceCompletedWOs.length - compliantCount,
        rate: complianceCompletedWOs.length > 0 ? ((compliantCount / complianceCompletedWOs.length) * 100).toFixed(1) : "0.0"
      },
      byPriority: Object.entries(priorityCounts).map(([name, value]) => ({ name, value })),
      scheduleCompliance: Number(complianceCompletedWOs.length > 0 ? ((compliantCount / complianceCompletedWOs.length) * 100).toFixed(1) : 0),
      monthlyTrend: complianceMonthlyTrend,
      hoursToPlanning: {
        estimated: complianceCompletedWOs.reduce((sum: Prisma.Decimal, wo: any) => sum.plus(new Prisma.Decimal(wo.estimatedHours || 0)), new Prisma.Decimal(0)).toNumber(),
        actual: (await this.prisma.workOrderTimeLog.aggregate({ 
          where: { workOrder: { ...woWhere, status: 'COMPLETED' } },
          _sum: { hoursLogged: true }
        }))._sum?.hoursLogged?.toNumber() || 0
      },
      availableLocations: await this.prisma.location.findMany({ where: { organizationId, deletedAt: null }, select: { id: true, name: true } }),
      availableCategories: await this.prisma.category.findMany({ where: { organizationId, type: 'WORK_ORDER' }, select: { id: true, name: true } }),
      availableAssets: await this.prisma.asset.findMany({ where: { organizationId, deletedAt: null }, select: { id: true, name: true } }),
      availableAssetCategories: await this.prisma.category.findMany({ where: { organizationId, type: 'ASSET' }, select: { id: true, name: true } }),
      availableTeams: await this.prisma.team.findMany({ where: { organizationId, deletedAt: null }, select: { id: true, name: true } }),
      availableUsers: await this.prisma.userOrganization.findMany({ 
        where: { organizationId }, 
        select: { id: true, user: { select: { name: true } } } 
      })
    };


    // --- Status Report Data ---
    // Filter by createdAt if specified (e.g., last 30 days by default if not provided, but usually analytics are for a period)
    const statusReportWOs = await this.prisma.workOrder.findMany({
      where: woWhere,
      select: {
        id: true,
        status: true,
        createdAt: true,
        completedAt: true,
        dueDate: true,
        estimatedHours: true,
        actualHours: true,
        assignedToId: true,
        assignedTo: { include: { user: { select: { name: true } } } }
      }
    });

    const statusCounts = statusReportWOs.reduce((acc: any, wo: any) => {
      acc[wo.status] = (acc[wo.status] || 0) + 1;
      return acc;
    }, {});

    const completedInReport = statusReportWOs.filter((wo: any) => wo.status === 'COMPLETED');
    const compliantInReport = completedInReport.filter((wo: any) => !wo.dueDate || new Date(wo.completedAt) <= new Date(wo.dueDate));
    
    let totalCycleTimeMs = 0;
    completedInReport.forEach((wo: any) => {
      totalCycleTimeMs += new Date(wo.completedAt).getTime() - new Date(wo.createdAt).getTime();
    });
    const avgCycleTimeDays = completedInReport.length > 0 
      ? (totalCycleTimeMs / completedInReport.length / (1000 * 60 * 60 * 24)).toFixed(1) 
      : 0;

    // Work Remaining by Worker
    const incompleteWOs = statusReportWOs.filter((wo: any) => wo.status !== 'COMPLETED');
    const workerMap = new Map();
    incompleteWOs.forEach((wo: any) => {
      const workerName = wo.assignedTo?.user?.name || 'Unassigned';
      if (!workerMap.has(workerName)) {
        workerMap.set(workerName, { name: workerName, count: 0, estimatedHours: 0 });
      }
      const data = workerMap.get(workerName);
      data.count += 1;
      data.estimatedHours += wo.estimatedHours || 0;
    });
    const workRemaining = Array.from(workerMap.values());

    const statusReport = {
      summary: {
        total: statusReportWOs.length,
        completed: completedInReport.length,
        compliant: compliantInReport.length,
        avgCycleTimeDays: Number(avgCycleTimeDays)
      },
      workOrderStatus: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
      workRemaining,
      totals: {
        estimatedHours: statusReportWOs.reduce((acc: Prisma.Decimal, wo: any) => acc.plus(new Prisma.Decimal(wo.estimatedHours || 0)), new Prisma.Decimal(0)).toNumber(),
        actualHours: statusReportWOs.reduce((acc: Prisma.Decimal, wo: any) => acc.plus(new Prisma.Decimal(wo.actualHours || 0)), new Prisma.Decimal(0)).toNumber()
      }
    };

    // --- Work Order Aging Logic ---
    const now = new Date();
    const totalAgeMs = incompleteWOs.reduce((acc, wo) => acc + (now.getTime() - new Date(wo.createdAt).getTime()), 0);
    const avgAgeDays = incompleteWOs.length > 0 ? (totalAgeMs / incompleteWOs.length / (1000 * 60 * 60 * 24)).toFixed(1) : 0;

    // Extend workerMap with avgAge
    const workerAging = Array.from(workerMap.values()).map(w => {
      const workerWOs = incompleteWOs.filter(wo => (wo.assignedTo?.user?.name || 'Unassigned') === w.name);
      const workerTotalAgeMs = workerWOs.reduce((acc, wo) => acc + (now.getTime() - new Date(wo.createdAt).getTime()), 0);
      return {
        ...w,
        avgAge: workerWOs.length > 0 ? Number((workerTotalAgeMs / workerWOs.length / (1000 * 60 * 60 * 24)).toFixed(1)) : 0
      };
    });

    // Asset Aging
    const assetMap = new Map();
    incompleteWOs.forEach((wo: any) => {
      const assetName = wo.asset?.name || 'No Asset';
      if (!assetMap.has(assetName)) {
        assetMap.set(assetName, { name: assetName, count: 0, totalAgeMs: 0 });
      }
      const data = assetMap.get(assetName);
      data.count += 1;
      data.totalAgeMs += (now.getTime() - new Date(wo.createdAt).getTime());
    });
    const assetAging = Array.from(assetMap.values()).map(a => ({
      name: a.name,
      count: a.count,
      avgAge: Number((a.totalAgeMs / a.count / (1000 * 60 * 60 * 24)).toFixed(1))
    })).sort((a, b) => b.count - a.count).slice(0, 10);

    // --- 15. Time & Cost (NEW) ---
    const timeAndCostWOs = await this.prisma.workOrder.findMany({
      where: { ...woWhere, status: 'COMPLETED' },
      select: {
        id: true,
        actualHours: true,
        partsCost: true,
        laborCost: true,
        additionalCost: true,
        totalCost: true,
        completedAt: true,
        assetId: true,
        asset: { select: { name: true } }
      }
    });

    const tcSummary = {
      hoursWorked: timeAndCostWOs.reduce((acc: Prisma.Decimal, wo: any) => acc.plus(new Prisma.Decimal(wo.actualHours || 0)), new Prisma.Decimal(0)).toNumber(),
      partCost: timeAndCostWOs.reduce((acc: Prisma.Decimal, wo: any) => acc.plus(new Prisma.Decimal(wo.partsCost || 0)), new Prisma.Decimal(0)).toNumber(),
      laborCost: timeAndCostWOs.reduce((acc: Prisma.Decimal, wo: any) => acc.plus(new Prisma.Decimal(wo.laborCost || 0)), new Prisma.Decimal(0)).toNumber(),
      additionalCost: timeAndCostWOs.reduce((acc: Prisma.Decimal, wo: any) => acc.plus(new Prisma.Decimal(wo.additionalCost || 0)), new Prisma.Decimal(0)).toNumber(),
      totalCost: timeAndCostWOs.reduce((acc: Prisma.Decimal, wo: any) => acc.plus(new Prisma.Decimal(wo.totalCost || 0)), new Prisma.Decimal(0)).toNumber(),
    };

    // Worker Time aggregation from TimeLogs
    const workerTimeLogs = await this.prisma.workOrderTimeLog.findMany({
      where: {
        workOrder: { ...woWhere, status: 'COMPLETED' }
      },
      include: {
        user: { include: { user: { select: { name: true } } } }
      }
    });

    const workerTimeMap = new Map();
    workerTimeLogs.forEach((log: any) => {
      const workerId = log.userId;
      const workerName = log.user?.user?.name || 'Unknown';
      if (!workerTimeMap.has(workerId)) {
        workerTimeMap.set(workerId, { id: workerId, name: workerName, workOrders: new Set(), time: new Prisma.Decimal(0), cost: new Prisma.Decimal(0) });
      }
      const entry = workerTimeMap.get(workerId);
      entry.workOrders.add(log.workOrderId);
      entry.time = entry.time.plus(new Prisma.Decimal(log.hoursLogged || 0));
      entry.cost = entry.cost.plus(new Prisma.Decimal(log.totalCost || 0));
    });

    const workerTime = Array.from(workerTimeMap.values()).map(w => ({
      id: w.id,
      name: w.name,
      workOrders: w.workOrders.size,
      time: w.time.toFixed(2),
      cost: w.cost.toFixed(2)
    })).sort((a, b) => parseFloat(b.time) - parseFloat(a.time));

    // Cost Trends (Monthly)
    const costTrends = await Promise.all(
      last3Months.map(async (m) => {
        const wosInMonth = timeAndCostWOs.filter((wo: any) => {
          const d = new Date(wo.completedAt);
          return d >= m.start && d <= m.end;
        });
        return {
          name: m.month,
          parts: wosInMonth.reduce((acc: Prisma.Decimal, wo: any) => acc.plus(new Prisma.Decimal(wo.partsCost || 0)), new Prisma.Decimal(0)).toNumber(),
          additional: wosInMonth.reduce((acc: Prisma.Decimal, wo: any) => acc.plus(new Prisma.Decimal(wo.additionalCost || 0)), new Prisma.Decimal(0)).toNumber(),
          labor: wosInMonth.reduce((acc: Prisma.Decimal, wo: any) => acc.plus(new Prisma.Decimal(wo.laborCost || 0)), new Prisma.Decimal(0)).toNumber(),
        };
      })
    );

    // Hours per Asset
    const assetTimeMap = new Map();
    timeAndCostWOs.forEach((wo: any) => {
      if (wo.assetId && wo.actualHours) {
        const assetName = wo.asset?.name || 'Unknown';
        const current = assetTimeMap.get(assetName) || new Prisma.Decimal(0);
        assetTimeMap.set(assetName, current.plus(new Prisma.Decimal(wo.actualHours)));
      }
    });

    const hoursPerAsset = Array.from(assetTimeMap.entries()).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2))
    })).sort((a, b) => b.value - a.value).slice(0, 10);

    // --- Meter Readings ---
    const meterWhere = this.buildMeterWhere(organizationId, filters);
    const meterReadings = await this.prisma.meterReading.findMany({
      where: meterWhere,
      include: {
        meter: {
          include: {
            asset: {
              include: { categoryRef: true }
            },
            location: true,
            category: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    console.log(`[AnalyticsService] Meter readings found for org ${organizationId}:`, meterReadings.length);

    const meterStats = await this.prisma.meterReading.aggregate({
      where: meterWhere,
      _avg: { value: true },
      _max: { value: true },
      _min: { value: true }
    });

    // --- Useful Life Data ---
    const usefulLifeAssets = await this.prisma.asset.findMany({
      where: assetWhere,
      select: {
        id: true,
        name: true,
        purchasePrice: true,
        purchaseDate: true,
        warrantyExpiry: true,
        usefulLifeYears: true,
        placedInServiceDate: true,
        createdAt: true,
        _count: {
          select: {
            workOrders: {
              where: { status: { not: 'COMPLETED' } }
            }
          }
        }
      }
    });

    // Metadata for FilterBar
    const [availableLocations, availableCategories, availableAssetCategories, availablePartCategories, availableAssets, availableWorkers, availableTeams, availableMeters, availableMeterCategories] = await Promise.all([
      this.prisma.location.findMany({ where: { organizationId, deletedAt: null }, select: { id: true, name: true } }),
      this.prisma.category.findMany({ where: { organizationId, type: 'WORK_ORDER' }, select: { id: true, name: true } }),
      this.prisma.category.findMany({ where: { organizationId, type: 'ASSET' }, select: { id: true, name: true } }),
      this.prisma.category.findMany({ where: { organizationId, type: 'PART' }, select: { id: true, name: true } }),
      this.prisma.asset.findMany({ where: { organizationId, deletedAt: null }, select: { id: true, name: true } }),
      this.prisma.userOrganization.findMany({ where: { organizationId }, select: { id: true, user: { select: { name: true } } } }),
      this.prisma.team.findMany({ where: { organizationId, deletedAt: null }, select: { id: true, name: true } }),
      this.prisma.meter.findMany({ where: { organizationId }, select: { id: true, name: true } }),
      this.prisma.category.findMany({ where: { organizationId, type: 'METER' }, select: { id: true, name: true } }),
    ]);

    // --- RCA Analytics ---
    const rcaBreakout = await this.prisma.workOrder.groupBy({
      where: { ...woWhere, status: 'COMPLETED', rootCause: { not: null } },
      by: ['rootCause'],
      _count: true,
      orderBy: { _count: { rootCause: 'desc' } },
    });

    const rca = rcaBreakout.map((stat: any) => ({
      name: stat.rootCause,
      value: stat._count,
    }));

    // --- LOTO Compliance ---
    const lotoWOs = await this.prisma.workOrder.findMany({
      where: { ...woWhere, requiresLOTO: true },
      select: { lotoVerified: true }
    });
    const lotoComplianceRate = lotoWOs.length > 0 
      ? ((lotoWOs.filter((w: any) => w.lotoVerified).length / lotoWOs.length) * 100).toFixed(1)
      : 100;

    // --- 16. Real-time Parts Analytics ---
    const workOrderParts = await this.prisma.workOrderPart.findMany({
      where: {
        workOrder: woWhere
      },
      include: {
        part: {
          include: {
            location: true
          }
        }
      }
    });

    const partsMap = new Map();
    let totalPartsConsumedVal = 0;
    let totalConsumptionCostVal = new Prisma.Decimal(0);

    workOrderParts.forEach((wop: any) => {
      const partId = wop.partId;
      const quantity = new Prisma.Decimal(wop.quantity || 0).toNumber();
      const cost = new Prisma.Decimal(wop.totalCost || 0);

      totalPartsConsumedVal += quantity;
      totalConsumptionCostVal = totalConsumptionCostVal.plus(cost);

      if (!partsMap.has(partId)) {
        partsMap.set(partId, {
          id: partId,
          name: wop.part?.name || 'Unknown Part',
          partNumber: wop.part?.partNumber || '',
          location: wop.part?.location?.name || 'N/A',
          currentQuantity: wop.part?.quantity || 0,
          unitPrice: new Prisma.Decimal(wop.unitCost || wop.part?.cost || 0).toNumber(),
          consumedQuantity: 0,
          trend: 0,
        });
      }

      const item = partsMap.get(partId);
      item.consumedQuantity += quantity;
    });

    const partsConsumptionItems = Array.from(partsMap.values());

    const partsTrendsMap = new Map<string, number>();
    workOrderParts.forEach((wop: any) => {
      const dateStr = new Date(wop.createdAt).toISOString().split('T')[0];
      const cost = new Prisma.Decimal(wop.totalCost || 0).toNumber();
      partsTrendsMap.set(dateStr, (partsTrendsMap.get(dateStr) || 0) + cost);
    });

    const partsTrends = Array.from(partsTrendsMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, cost]) => {
        const d = new Date(date);
        return {
          date: d.toLocaleDateString('default', { month: 'short', day: 'numeric' }),
          cost
        };
      });

    // --- Parts Inventory Data (Current Snapshot) ---
    const allParts = await this.prisma.part.findMany({
      where: partWhere,
      include: { location: true }
    });

    const inventoryItems = allParts.map((p: any) => ({
      id: p.id,
      name: p.name,
      partNumber: p.partNumber,
      location: p.location?.name,
      quantity: p.quantity || 0,
      cost: p.cost || 0,
      totalValue: new Prisma.Decimal(p.quantity || 0).mul(new Prisma.Decimal(p.cost || 0)).toNumber(),
      maxQuantity: p.maxQuantity || 100
    }));

    const totalInventoryValue = inventoryItems.reduce((sum: number, item: any) => sum + item.totalValue, 0);
    const itemsOnHandCount = inventoryItems.reduce((sum: number, item: any) => sum + item.quantity, 0);

    // --- 17. Real-time Requests Analytics ---
    const closedRequests = await this.prisma.maintenanceRequest.findMany({
      where: {
        ...this.buildRequestWhere(organizationId, filters),
        status: { in: ['APPROVED', 'REJECTED'] }
      },
      select: { createdAt: true, updatedAt: true }
    });

    let totalRequestCycleTimeMs = 0;
    closedRequests.forEach((req: any) => {
      totalRequestCycleTimeMs += new Date(req.updatedAt).getTime() - new Date(req.createdAt).getTime();
    });

    const requestAvgCycleTimeDays = closedRequests.length > 0 
      ? Number((totalRequestCycleTimeMs / closedRequests.length / (1000 * 60 * 60 * 24)).toFixed(1))
      : 0;

    const requestCycleTimeTrend = await Promise.all(
      last3Months.map(async (m) => {
        const reqsInMonth = closedRequests.filter((req: any) => {
          const d = new Date(req.updatedAt);
          return d >= m.start && d <= m.end;
        });

        let monthTotalMs = 0;
        reqsInMonth.forEach((req: any) => {
          monthTotalMs += new Date(req.updatedAt).getTime() - new Date(req.createdAt).getTime();
        });

        const avgDays = reqsInMonth.length > 0 
          ? Number((monthTotalMs / reqsInMonth.length / (1000 * 60 * 60 * 24)).toFixed(1))
          : 0;

        return {
          name: m.month,
          value: avgDays
        };
      })
    );

    const stats: any = {
      metadata: {
        availableLocations: availableLocations || [],
        availableCategories: availableCategories || [],
        availableAssetCategories: availableAssetCategories || [],
        availablePartCategories: availablePartCategories || [],
        availableAssets: availableAssets || [],
        availableWorkers: availableWorkers?.map((w: any) => ({ id: w.id, name: w.user?.name })).filter((w: any) => !!w.name) || [],
        availableTeams: availableTeams || [],
        availableMeters: availableMeters || [],
        availableMeterCategories: availableMeterCategories || [],
      },
      assets: usefulLifeAssets.map(a => ({
        ...a,
        incompleteWorkOrdersCount: a._count.workOrders
      })),
      meterReadings,
      meterStats: {
        avg: meterStats._avg.value || 0,
        max: meterStats._max.value || 0,
        min: meterStats._min.value || 0
      },
      overview: { 
        totalAssets, 
        totalWorkOrders, 
        totalRequests, 
        totalUsers, 
        totalLocations, 
        mttrHours, 
        mwtHours: Number(mwtHours),
        mttfHours: Number(mttfHours),
        mtbfHours: Number(mtbfHours), 
        pmComplianceRate: Number(pmComplianceRate), 
        lotoComplianceRate: Number(lotoComplianceRate), 
        assetAvailability: Number(assetAvailability), 
        totalStockValue: Number(totalStockValue.toFixed(2)), 
        totalCosts: costs._sum.totalCost || 0,
        totalPartsCost: costStats.parts,
        uniquePartsCount,
        lowStockCount,
      },
      workOrderStatus,
      assetStatus,
      teamPerformance: { monthlyTrend, topTechnicians, topLocations, typeMix, backlog },
      costMaintenance: { stats: costStats, weeklyTrend: weeklyCosts, breakouts: { asset: hydratedAssetBreakout, category: categoryBreakout.map((c: any) => ({ name: c.category || 'Uncategorized', value: c._sum.totalCost })), location: hydratedLocationBreakout }, avgCosts, totalPurchasePrice, costAsPctOfRav },
      assetDowntime: { status: { utilization: overallUtilization, operational: operationalStatusStats.operational, nonOperational: operationalStatusStats.nonOperational }, topAssets: topAssetsDowntime, locationUtilization: locationUtilData || [], categoryUtilization: categoryUtilData || [], utilizationOverTime, downtimeHistory },
      adoptionMetrics: adoptionStats,
      complianceMetrics,
      reliability: {
        mttr: Number(mttrHours),
        mwt: Number(mwtHours),
        mwtTrend,
        mttf: Number(mttfHours),
        mtbf: Number(mtbfHours),
        availability: Number(assetAvailability),
        rca
      },
      statusReport,
      woAging: {
        count: incompleteWOs.length,
        avgAge: Number(avgAgeDays),
        assignedWorkers: workerAging,
        assets: assetAging
      },
      timeAndCost: {
        summary: tcSummary,
        workerTime,
        costTrends,
        hoursPerAsset
      },
      parts: {
        totalConsumptionCost: totalConsumptionCostVal.toNumber(),
        totalPartsConsumed: totalPartsConsumedVal,
        consumptionItems: partsConsumptionItems,
        trends: partsTrends,
        inventoryItems,
        totalInventoryValue,
        itemsOnHandCount
      },
      requests: {
        approvedCount: await this.prisma.maintenanceRequest.count({ 
          where: { ...this.buildRequestWhere(organizationId, filters), status: 'APPROVED' } 
        }),
        declinedCount: await this.prisma.maintenanceRequest.count({ 
          where: { ...this.buildRequestWhere(organizationId, filters), status: 'REJECTED' } 
        }),
        pendingCount: await this.prisma.maintenanceRequest.count({ 
          where: { ...this.buildRequestWhere(organizationId, filters), status: 'PENDING' } 
        }),
        byPriority: (await this.prisma.maintenanceRequest.groupBy({
          where: this.buildRequestWhere(organizationId, filters),
          by: ['priority'],
          _count: true
        })).map((p: any) => ({ name: p.priority, value: p._count })),
        avgCycleTime: requestAvgCycleTimeDays,
        cycleTimeTrend: requestCycleTimeTrend
      },
      itemizedTimeReport: (await this.prisma.workOrderTimeLog.findMany({
        where: { 
          workOrder: woWhere,
          ...(this.getDateRangeCondition(filters?.dateRange, timezone) ? { startTime: this.getDateRangeCondition(filters.dateRange, timezone) } : {})
        },
        include: {
          user: { include: { user: true } },
          workOrder: {
            include: {
              location: true,
              asset: true,
              categoryRef: true
            }
          }
        },
        orderBy: { startTime: 'desc' },
        take: 500
      })).map((log: any) => ({
        startTime: log.startTime?.toISOString() || log.createdAt.toISOString(),
        endTime: log.endTime?.toISOString() || '-',
        type: log.workOrder.maintenanceType,
        workerName: `${log.user?.user?.firstName || ''} ${log.user?.user?.lastName || ''}`,
        hourlyRate: log.hourlyRate || 0,
        woTitle: log.workOrder.title,
        woNumber: log.workOrder.id.slice(0, 8),
        woLocation: log.workOrder.location?.name || '-',
        woAsset: log.workOrder.asset?.name || '-',
        woCategory: log.workOrder.categoryRef?.name || '-',
        timerCategory: log.description || 'Maintenance',
        totalHours: log.hoursLogged || 0,
        totalLaborCost: log.totalCost || 0
      })),
      userLoginReport: (await this.prisma.userOrganization.findMany({
        where: { organizationId },
        include: { 
          user: true,
          role: true
        }
      })).map((uo: any) => ({
        name: uo.user?.firstName + ' ' + uo.user?.lastName,
        email: uo.user?.email,
        id: uo.userId.slice(-8).toUpperCase(),
        jobTitle: uo.jobTitle || 'n/a',
        lastLogin: uo.user?.lastLogin ? new Date(uo.user.lastLogin).toISOString().split('T')[0] : 'N/A',
        accountType: uo.role?.name || 'Member'
      })),
      assetAuditLog: await Promise.all((await this.prisma.auditLog.findMany({
        where: { 
          organizationId, 
          model: 'Asset',
          ...(filters?.assets?.length > 0 ? { entityId: { in: filters.assets } } : {}),
          ...(this.getDateRangeCondition(filters?.dateRange, timezone) ? { createdAt: this.getDateRangeCondition(filters.dateRange, timezone) } : {})
        },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        take: 200
      })).map(async (log: any) => {
        const asset = await this.prisma.asset.findUnique({ 
          where: { id: log.entityId },
          select: { name: true }
        });
        return {
          assetName: asset?.name || 'Asset #' + log.entityId.slice(-6).toUpperCase(),
          action: log.action,
          userName: log.user ? log.user.firstName + ' ' + log.user.lastName : 'System',
          field: Object.keys(log.newData || {}).join(', ') || '-',
          oldValue: JSON.stringify(log.oldData),
          newValue: JSON.stringify(log.newData),
          date: new Date(log.createdAt).toLocaleString()
        };
      }))
    };

    return stats;
  }

  private buildWhere(organizationId: string, filters?: any) {
    const timezone = filters?.timezone || 'UTC';
    const where: any = { organizationId, deletedAt: null };
    if (filters) {
      if (filters.locations?.length > 0) where.locationId = { in: filters.locations };
      if (filters.assetCategory?.length > 0) where.categoryId = { in: filters.assetCategory };
      if (filters.assets?.length > 0) where.id = { in: filters.assets };
      
      // Asset Status Filter
      if (filters.assetStatus === 'is archived') where.deletedAt = { not: null };
      else if (filters.assetStatus === 'is active') where.deletedAt = null;

      // Warranty Date Filter
      if (filters.warrantyDate && filters.warrantyDate !== 'is any value') {
        const dateCondition = this.getDateRangeCondition(filters.warrantyDate, timezone);
        if (dateCondition) where.warrantyExpiry = dateCondition;
      }
    }
    return where;
  }

  private toArr = (v: any): any[] | null => {
    if (!v) return null;
    const arr = Array.isArray(v) ? v : [v];
    return arr.length > 0 ? arr : null;
  };

  private buildWOWhere(organizationId: string, filters?: any) {
    const timezone = filters?.timezone || 'UTC';
    const where: any = { organizationId, deletedAt: null };
    if (filters) {
      const locs = this.toArr(filters.locations);
      if (locs) where.locationId = { in: locs };

      const cats = this.toArr(filters.categories);
      if (cats) where.categoryId = { in: cats };

      const assets = this.toArr(filters.assets);
      if (assets) where.assetId = { in: assets };

      if (filters.worker && filters.worker !== 'any value') where.assignedToId = filters.worker;
      if (filters.priority && filters.priority !== 'any value') where.priority = filters.priority;
      if (filters.type && filters.type !== 'any value') where.maintenanceType = filters.type;

      const assetCats = this.toArr(filters.assetCategory);
      if (assetCats) where.asset = { ...where.asset, categoryId: { in: assetCats } };

      // Team Filter — WO model uses assignedTeamId
      const teams = this.toArr(filters.teams);
      if (teams) {
        where.assignedTeamId = { in: teams };
      }

      // Advanced Date Filters (Parsed from JSON strings)
      if (filters.dateCompletedFilters) {
        try {
          const parsed = typeof filters.dateCompletedFilters === 'string' ? JSON.parse(filters.dateCompletedFilters) : filters.dateCompletedFilters;
          const condition = this.parseDateFilters(parsed, timezone);
          if (Object.keys(condition).length > 0) where.completedAt = condition;
        } catch (e) {}
      }

      if (filters.dueDateFilters) {
        try {
          const parsed = typeof filters.dueDateFilters === 'string' ? JSON.parse(filters.dueDateFilters) : filters.dueDateFilters;
          const condition = this.parseDateFilters(parsed, timezone);
          if (Object.keys(condition).length > 0) where.dueDate = condition;
        } catch (e) {}
      }
      
      const dateCondition = this.getDateRangeCondition(filters.dateRange, timezone);
      if (dateCondition && !where.completedAt) {
        where.createdAt = dateCondition;
      }

      // Downtime Category Mapping
      if (filters.downtimeCategory === 'Planned') {
        where.maintenanceType = { in: ['PREVENTIVE', 'INSPECTION', 'SAFETY'] };
      } else if (filters.downtimeCategory === 'Unplanned') {
        where.maintenanceType = { in: ['REACTIVE', 'CORRECTIVE'] };
      }
    }
    return where;
  }

  private buildMeterWhere(organizationId: string, filters?: any) {
    const timezone = filters?.timezone || 'UTC';
    // Build meter nested object carefully to avoid overwriting
    const meterCondition: any = { organizationId };
    if (filters) {
      // locations filter on the meter's own locationId
      if (filters.locations?.length > 0) meterCondition.locationId = { in: Array.isArray(filters.locations) ? filters.locations : [filters.locations] };
      // meterName filter: frontend sends meter IDs (option value = id), filter by id
      if (filters.meterName?.length > 0) meterCondition.id = { in: Array.isArray(filters.meterName) ? filters.meterName : [filters.meterName] };
      // assets filter on the meter's assetId
      if (filters.assets?.length > 0) meterCondition.assetId = { in: Array.isArray(filters.assets) ? filters.assets : [filters.assets] };
      // assetCategory: filter through nested asset relation
      if (filters.assetCategory?.length > 0) meterCondition.asset = { categoryId: { in: Array.isArray(filters.assetCategory) ? filters.assetCategory : [filters.assetCategory] } };
      // meterCategory: filter by meter's own categoryId
      if (filters.meterCategory?.length > 0) meterCondition.categoryId = { in: Array.isArray(filters.meterCategory) ? filters.meterCategory : [filters.meterCategory] };
      // date range on reading createdAt handled below at the reading level
    }
    const where: any = { meter: meterCondition };
    // Apply date range to meter reading's createdAt
    if (filters?.dateRange) {
      const dateCondition = this.getDateRangeCondition(filters.dateRange, timezone);
      if (dateCondition) where.createdAt = dateCondition;
    }
    return where;
  }

  private getDateRangeCondition(range?: string, timezone: string = 'UTC'): { gte?: Date; lte?: Date } | undefined {
    if (!range || range === 'All Time' || range === 'is any value') return undefined;

    const nowUTC = new Date();
    const zonedNow = toZonedTime(nowUTC, timezone);
    const start = new Date(zonedNow);
    let end: Date | undefined;

    switch (range) {
      // ── Single-day ──────────────────────────────────────────────────────────
      case 'Today':
        start.setHours(0, 0, 0, 0);
        end = new Date(zonedNow); end.setHours(23, 59, 59, 999);
        break;
      case 'Yesterday': {
        const y = new Date(zonedNow); y.setDate(zonedNow.getDate() - 1);
        y.setHours(0, 0, 0, 0);
        start.setTime(y.getTime());
        end = new Date(y); end.setHours(23, 59, 59, 999);
        break;
      }
      // ── Rolling N days ──────────────────────────────────────────────────────
      case 'Last 7 Days':    start.setDate(zonedNow.getDate() - 7); break;
      case 'Last 14 Days':   start.setDate(zonedNow.getDate() - 14); break;
      case 'Last 28 Days':   start.setDate(zonedNow.getDate() - 28); break;
      case 'Last 30 Days':   start.setDate(zonedNow.getDate() - 30); break;
      case 'Last 90 Days':   start.setDate(zonedNow.getDate() - 90); break;
      case 'Last 180 Days':  start.setDate(zonedNow.getDate() - 180); break;
      case 'Last 365 Days':  start.setDate(zonedNow.getDate() - 365); break;
      // ── Calendar-aligned (current period) ───────────────────────────────────
      case 'Year To Date':
        start.setMonth(0, 1); start.setHours(0, 0, 0, 0);
        break;
      case 'This Week': {
        const day = zonedNow.getDay(); // 0=Sun
        start.setDate(zonedNow.getDate() - day); start.setHours(0, 0, 0, 0);
        break;
      }
      case 'This Month':
        start.setDate(1); start.setHours(0, 0, 0, 0);
        break;
      case 'This Quarter': {
        const q = Math.floor(zonedNow.getMonth() / 3);
        start.setMonth(q * 3, 1); start.setHours(0, 0, 0, 0);
        break;
      }
      case 'This Year':
        start.setMonth(0, 1); start.setHours(0, 0, 0, 0);
        break;
      // ── Calendar-aligned (previous period) ──────────────────────────────────
      case 'Previous Week': {
        const day = zonedNow.getDay();
        end = new Date(zonedNow); end.setDate(zonedNow.getDate() - day - 1); end.setHours(23, 59, 59, 999);
        start.setTime(end.getTime()); start.setDate(end.getDate() - 6); start.setHours(0, 0, 0, 0);
        break;
      }
      case 'Previous Month': {
        start.setDate(1); start.setMonth(zonedNow.getMonth() - 1); start.setHours(0, 0, 0, 0);
        end = new Date(zonedNow.getFullYear(), zonedNow.getMonth(), 0, 23, 59, 59, 999);
        break;
      }
      case 'Previous Quarter': {
        const q = Math.floor(zonedNow.getMonth() / 3);
        const pq = q === 0 ? 3 : q - 1;
        const yr = q === 0 ? zonedNow.getFullYear() - 1 : zonedNow.getFullYear();
        start.setFullYear(yr, pq * 3, 1); start.setHours(0, 0, 0, 0);
        end = new Date(yr, pq * 3 + 3, 0, 23, 59, 59, 999);
        break;
      }
      case 'Previous Year': {
        const py = zonedNow.getFullYear() - 1;
        start.setFullYear(py, 0, 1); start.setHours(0, 0, 0, 0);
        end = new Date(py, 11, 31, 23, 59, 59, 999);
        break;
      }
      default:
        return undefined;
    }

    const startUTC = fromZonedTime(start, timezone);
    const endUTC = end ? fromZonedTime(end, timezone) : undefined;

    return endUTC ? { gte: startUTC, lte: endUTC } : { gte: startUTC };
  }

  private buildPartWhere(organizationId: string, filters?: any) {
    const where: any = { organizationId, deletedAt: null };
    if (filters) {
      if (filters.partLocation?.length > 0) where.locationId = { in: filters.partLocation };
      if (filters.partCategory?.length > 0) where.categoryId = { in: filters.partCategory };
      if (filters.partNumber && filters.partNumber !== 'any value' && filters.partNumber !== '') {
        where.partNumber = { contains: filters.partNumber, mode: 'insensitive' };
      }
    }
    return where;
  }

  private buildRequestWhere(organizationId: string, filters?: any) {
    const timezone = filters?.timezone || 'UTC';
    const where: any = { organizationId, deletedAt: null };
    if (filters) {
      if (filters.locations?.length > 0) where.locationId = { in: Array.isArray(filters.locations) ? filters.locations : [filters.locations] };
      if (filters.assets?.length > 0) where.assetId = { in: Array.isArray(filters.assets) ? filters.assets : [filters.assets] };
      // categories on Requests = direct categoryId on the MaintenanceRequest model
      if (filters.categories?.length > 0) {
        where.categoryId = { in: Array.isArray(filters.categories) ? filters.categories : [filters.categories] };
      }
      if (filters.priority && filters.priority !== 'any value') {
        where.priority = filters.priority;
      }
      
      const dateCondition = this.getDateRangeCondition(filters.dateRange, timezone);
      if (dateCondition) {
        where.createdAt = dateCondition;
      }
    }
    return where;
  }

  private parseDateFilters(dateFilters: any[], timezone: string = 'UTC') {
    if (!dateFilters || !Array.isArray(dateFilters) || dateFilters.length === 0) return {};
    
    const conditions: any[] = [];
    dateFilters.forEach(f => {
      const nowUTC = new Date();
      const zonedNow = toZonedTime(nowUTC, timezone);
      const date = new Date(zonedNow);
      const amount = parseInt(f.value);
      
      switch(f.operator) {
        case 'is in the last':
          if (f.unit.includes('second')) date.setSeconds(zonedNow.getSeconds() - amount);
          else if (f.unit.includes('minute')) date.setMinutes(zonedNow.getMinutes() - amount);
          else if (f.unit.includes('hour')) date.setHours(zonedNow.getHours() - amount);
          else if (f.unit.includes('day')) date.setDate(zonedNow.getDate() - amount);
          else if (f.unit.includes('week')) date.setDate(zonedNow.getDate() - (amount * 7));
          else if (f.unit.includes('month')) date.setMonth(zonedNow.getMonth() - amount);
          else if (f.unit.includes('quarter')) date.setMonth(zonedNow.getMonth() - (amount * 3));
          else if (f.unit.includes('year')) date.setFullYear(zonedNow.getFullYear() - amount);

          if (f.unit.startsWith('complete')) {
            if (f.unit.includes('minute')) date.setSeconds(0, 0);
            else if (f.unit.includes('hour')) date.setMinutes(0, 0, 0);
            else if (f.unit.includes('day')) date.setHours(0, 0, 0, 0);
            else if (f.unit.includes('week')) {
              date.setDate(date.getDate() - date.getDay());
              date.setHours(0, 0, 0, 0);
            }
            else if (f.unit.includes('month')) date.setDate(1);
            else if (f.unit.includes('quarter')) {
              const q = Math.floor(date.getMonth() / 3);
              date.setMonth(q * 3, 1);
            }
            else if (f.unit.includes('year')) date.setMonth(0, 1);
          }
          conditions.push({ gte: fromZonedTime(date, timezone) });
          break;
        case 'is before':
          conditions.push({ lt: fromZonedTime(new Date(f.value), timezone) });
          break;
        case 'is on or after':
          conditions.push({ gte: fromZonedTime(new Date(f.value), timezone) });
          break;
        case 'is null':
          conditions.push({ equals: null });
          break;
        case 'is not null':
          conditions.push({ not: null });
          break;
        case 'is on the day':
          const startOfDay = new Date(f.value);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(f.value);
          endOfDay.setHours(23, 59, 59, 999);
          conditions.push({ gte: fromZonedTime(startOfDay, timezone), lte: fromZonedTime(endOfDay, timezone) });
          break;
        case 'is this':
          if (f.unit.includes('day')) {
            const s = new Date(zonedNow); s.setHours(0,0,0,0);
            const e = new Date(zonedNow); e.setHours(23,59,59,999);
            conditions.push({ gte: fromZonedTime(s, timezone), lte: fromZonedTime(e, timezone) });
          } else if (f.unit.includes('week')) {
            const startOfWeek = new Date(zonedNow);
            startOfWeek.setDate(zonedNow.getDate() - zonedNow.getDay());
            startOfWeek.setHours(0,0,0,0);
            conditions.push({ gte: fromZonedTime(startOfWeek, timezone) });
          } else if (f.unit.includes('month')) {
            const startOfMonth = new Date(zonedNow.getFullYear(), zonedNow.getMonth(), 1);
            conditions.push({ gte: fromZonedTime(startOfMonth, timezone) });
          }
          break;
        case 'is next':
          const nextDate = new Date(zonedNow);
          if (f.unit.includes('day')) nextDate.setDate(zonedNow.getDate() + amount);
          else if (f.unit.includes('week')) nextDate.setDate(zonedNow.getDate() + (amount * 7));
          else if (f.unit.includes('month')) nextDate.setMonth(zonedNow.getMonth() + amount);
          conditions.push({ lte: fromZonedTime(nextDate, timezone), gte: fromZonedTime(zonedNow, timezone) });
          break;
        case 'is previous':
          const prevDate = new Date(zonedNow);
          if (f.unit.includes('day')) prevDate.setDate(zonedNow.getDate() - amount);
          else if (f.unit.includes('week')) prevDate.setDate(zonedNow.getDate() - (amount * 7));
          else if (f.unit.includes('month')) prevDate.setMonth(zonedNow.getMonth() - amount);
          conditions.push({ gte: fromZonedTime(prevDate, timezone), lte: fromZonedTime(zonedNow, timezone) });
          break;
        case 'is in the year':
          const yearStart = new Date(parseInt(f.value), 0, 1);
          const yearEnd = new Date(parseInt(f.value), 11, 31, 23, 59, 59);
          conditions.push({ gte: fromZonedTime(yearStart, timezone), lte: fromZonedTime(yearEnd, timezone) });
          break;
        case 'is in the month':
          const [y, m] = f.value.split('-').map(Number);
          const monthStart = new Date(y, m - 1, 1);
          const monthEnd = new Date(y, m, 0, 23, 59, 59);
          conditions.push({ gte: fromZonedTime(monthStart, timezone), lte: fromZonedTime(monthEnd, timezone) });
          break;
      }
    });
    
    if (conditions.length === 0) return {};
    return conditions.length === 1 ? conditions[0] : { AND: conditions };
  }
}
