import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ImpersonationService {
  constructor(private prisma: PrismaService) {}

  async startImpersonation(systemAdminId: string, targetOrganizationId: string, reason: string, ipAddress?: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: targetOrganizationId },
    });
    
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const session = await this.prisma.impersonationSession.create({
      data: {
        systemAdminUserId: systemAdminId,
        targetOrganizationId,
        reason,
        ipAddress,
      },
    });

    return {
      session,
      message: 'Impersonation session started. Use session ID to generate impersonation token.',
    };
  }

  async endImpersonation(sessionId: string) {
    return this.prisma.impersonationSession.update({
      where: { id: sessionId },
      data: { endedAt: new Date() },
    });
  }
}
