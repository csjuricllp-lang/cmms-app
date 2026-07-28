import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, AuditLog } from '@prisma/client';

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

  async findAll(
    model?: string,
    userId?: string,
    action?: string,
  ): Promise<AuditLogWithUser[]> {
    return this.prisma.auditLog.findMany({
      where: {
        model,
        userId,
        action,
      },
      include: AUDIT_INCLUDES,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
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
