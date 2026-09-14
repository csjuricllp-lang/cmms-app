import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OrganizationsAdminService {
  constructor(private prisma: PrismaService) {}

  async findAll(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.organization.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { members: true },
          },
        },
      }),
      this.prisma.organization.count(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    return this.prisma.organization.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                lastActiveAt: true,
              },
            },
            role: true,
          },
        },
      },
    });
  }

  async updateStatus(id: string, status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_DELETION', reason?: string) {
    // Audit log will be captured by the interceptor
    return this.prisma.organization.update({
      where: { id },
      data: { status },
    });
  }

  async updateTier(id: string, planId: string) {
    // Requires OrganizationSubscription to exist or create it
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new Error('Plan not found');

    const org = await this.prisma.organization.update({
      where: { id },
      data: { plan: plan.name },
    });

    await this.prisma.organizationSubscription.upsert({
      where: { organizationId: id },
      update: { planId, forceSetByAdmin: true },
      create: { organizationId: id, planId, forceSetByAdmin: true },
    });

    return org;
  }
}
