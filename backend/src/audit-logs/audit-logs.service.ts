import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, AuditLog } from '@prisma/client';
import { TenancyContext } from '../common/tenancy.context';

const AUDIT_INCLUDES = {
  user: {
    select: {
      name: true,
      email: true,
      avatarUrl: true,
    },
  },
} as const;

export type AuditLogWithUser = Prisma.AuditLogGetPayload<{
  include: typeof AUDIT_INCLUDES;
}>;

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  async create(model: string, entityId: string, action: string, newData?: any, oldData?: any) {
    const organizationId = TenancyContext.organizationId || 'SYSTEM';
    const userId = TenancyContext.userId;

    let finalNewData = newData ? JSON.parse(JSON.stringify(newData)) : null;
    let finalOldData = oldData ? JSON.parse(JSON.stringify(oldData)) : null;

    if (finalNewData && finalOldData && action.includes('UPDATE')) {
      const diffNew: any = {};
      const diffOld: any = {};
      
      for (const key of Object.keys(finalNewData)) {
        if (key === 'updatedAt' || key === 'createdAt') continue;
        if (JSON.stringify(finalNewData[key]) !== JSON.stringify(finalOldData[key])) {
          diffNew[key] = finalNewData[key];
          diffOld[key] = finalOldData[key];
        }
      }
      
      finalNewData = Object.keys(diffNew).length > 0 ? diffNew : Prisma.JsonNull;
      finalOldData = Object.keys(diffOld).length > 0 ? diffOld : Prisma.JsonNull;
    } else {
        finalNewData = finalNewData || Prisma.JsonNull;
        finalOldData = finalOldData || Prisma.JsonNull;
    }

    return this.prisma.auditLog.create({
      data: {
        model,
        entityId,
        action,
        newData: finalNewData,
        oldData: finalOldData,
        userId,
        organizationId,
      },
    });
  }

  async findAll(
    model?: string,
    userId?: string,
    action?: string,
    search?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ items: AuditLogWithUser[], meta: any }> {
    
    const where: Prisma.AuditLogWhereInput = {
      model,
      userId,
      action,
    };

    if (search) {
      where.OR = [
        { model: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
        { user: { is: { name: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: AUDIT_INCLUDES,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      this.prisma.auditLog.count({ where })
    ]);

    return {
      items,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  async findByEntity(
    model: string,
    entityId: string,
  ): Promise<AuditLogWithUser[]> {
    return this.prisma.auditLog.findMany({
      where: {
        model,
        entityId,
      },
      include: AUDIT_INCLUDES,
      orderBy: { createdAt: 'desc' },
    });
  }
}
