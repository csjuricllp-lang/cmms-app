import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PlatformAnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getMetricsSnapshot() {
    const totalOrgs = await this.prisma.organization.count();

    const activeOrgs = await this.prisma.organization.count({
      where: { status: 'ACTIVE' },
    });

    const totalUsers = await this.prisma.user.count();

    const recentActivity = await this.prisma.systemAuditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    const orgsNeedingAttention = await this.prisma.organization.findMany({
      where: {
        status: { in: ['SUSPENDED', 'PENDING_DELETION'] }
      },
      take: 5,
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, status: true, updatedAt: true }
    });

    return {
      totalOrganizations: totalOrgs,
      activeOrganizations: activeOrgs,
      totalUsers: totalUsers,
      monthlyRecurringRevenueCents: 0, // Placeholder until billing is implemented
      systemHealth: 'ONLINE',
      recentActivity,
      orgsNeedingAttention
    };
  }
}
