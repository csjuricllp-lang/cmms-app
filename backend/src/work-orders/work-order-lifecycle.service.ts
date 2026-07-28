import { Injectable, BadRequestException, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenancyContext } from '../common/tenancy.context';
import { SLAService } from '../sla/sla.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Permissions } from '../auth/permissions/permissions.constants';
import { AddLOTODto } from './dto/add-loto.dto';

@Injectable()
export class WorkOrderLifecycleService {
  private readonly logger = new Logger(WorkOrderLifecycleService.name);

  constructor(
    private prisma: PrismaService,
    private slaService: SLAService,
    private gateway: NotificationsGateway,
    private notificationsService: NotificationsService,
    private eventEmitter: EventEmitter2,
  ) {}

  async startWorkTimer(workOrderId: string, userId: string) {
    const active = await this.prisma.workOrderTimeLog.findFirst({
      where: { workOrderId, userId, endTime: null },
    });
    if (active) return;

    await this.prisma.workOrderTimeLog.create({
      data: {
        workOrderId,
        userId,
        startTime: new Date(),
        hourlyRate: 0,
        hoursLogged: 0,
        totalCost: 0,
        description: 'Automated Log (Clock-In)',
      },
    });
  }

  async pauseWorkTimer(workOrderId: string, userId: string) {
    // First try to find the specific user's active log
    let active = await this.prisma.workOrderTimeLog.findFirst({
      where: { workOrderId, userId, endTime: null },
    });

    // Fallback: if no log for this user, find ANY active log for this work order
    // This handles cases where the timer was started via a status transition by a different context
    if (!active) {
      active = await this.prisma.workOrderTimeLog.findFirst({
        where: { workOrderId, endTime: null },
        orderBy: { startTime: 'asc' },
      });
    }

    if (!active) return;

    // Use the userId from the active log (may differ from the requesting user)
    const activeUserId = active.userId;
    const userOrg = await this.prisma.userOrganization.findUnique({
      where: { id: activeUserId },
    });
    const hourlyRate = new Prisma.Decimal(userOrg?.hourlyRate || 0);
    const endTime = new Date();
    const startTime = active.startTime || new Date();
    const durationMs = Math.max(0, endTime.getTime() - startTime.getTime());
    const hoursLogged = new Prisma.Decimal(durationMs / (1000 * 60 * 60));

    return this.prisma.$transaction(async (tx: any) => {
      const totalCostLine = hoursLogged.mul(hourlyRate);

      await tx.workOrderTimeLog.update({
        where: { id: active.id },
        data: {
          endTime,
          hoursLogged,
          hourlyRate,
          totalCost: totalCostLine,
        },
      });

      const wo = await tx.workOrder.findUnique({ where: { id: workOrderId } });
      // Use plain Error inside Prisma transactions — NestJS exceptions thrown inside
      // $transaction callbacks get swallowed and re-thrown as generic errors
      if (!wo) throw new Error(`Work Order ${workOrderId} not found`);

      const laborCost = new Prisma.Decimal(wo.laborCost || 0).plus(totalCostLine);
      const actualHours = new Prisma.Decimal(wo.actualHours || 0).plus(hoursLogged);
      const totalCost = laborCost
        .plus(new Prisma.Decimal(wo.partsCost || 0))
        .plus(new Prisma.Decimal(wo.additionalCost || 0));

      await tx.workOrder.update({
        where: { id: workOrderId },
        data: { 
          laborCost, 
          actualHours, 
          totalCost 
        },
      });
    });
  }

  /**
   * Close ALL open time logs for a work order regardless of user.
   * Used when force-stopping a timer that may have been started by a status transition.
   */
  async pauseAllActiveTimers(workOrderId: string) {
    const activeLogs = await this.prisma.workOrderTimeLog.findMany({
      where: { workOrderId, endTime: null },
    });

    for (const log of activeLogs) {
      await this.pauseWorkTimer(workOrderId, log.userId);
    }
  }

  async processApproval(id: string, status: 'APPROVED' | 'REJECTED', notes?: string) {
    const organizationId = TenancyContext.organizationId;
    const userOrgId = TenancyContext.userOrgId;

    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id, organizationId },
    });
    
    if (!workOrder || workOrder.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException('This work order is not awaiting approval.');
    }

    const chain = await this.prisma.approvalChain.findUnique({
      where: { id: workOrder.approvalChainId || undefined },
      include: { steps: { orderBy: { order: 'asc' } as any } as any },
    }) as any;

    if (!chain) throw new NotFoundException('Approval chain not found.');

    const currentStep = chain.steps.find((s: any) => s.order === workOrder.currentApprovalStep);
    if (!currentStep) throw new BadRequestException('Invalid approval step.');

    const userOrg = await this.prisma.userOrganization.findUnique({
      where: { id: userOrgId },
      include: { role: true } as any,
    });

    if (!userOrg) throw new NotFoundException('User Organization not found');

    if (userOrg.roleId !== currentStep.roleId) {
      throw new ForbiddenException(`Access Denied: Only users with role "${currentStep.role.name}" can approve at this step.`);
    }

    return this.prisma.$transaction(async (tx: any) => {
      await tx.approvalRecord.create({
        data: {
          workOrderId: id,
          userId: userOrgId,
          status,
          notes,
          stepOrder: workOrder.currentApprovalStep,
          organizationId,
        },
      });

      if (status === 'REJECTED') {
        return tx.workOrder.update({
          where: { id },
          data: { status: 'CANCELLED' },
        });
      }

      const nextStep = chain.steps.find((s: any) => s.order === workOrder.currentApprovalStep + 1);
      if (nextStep) {
        return tx.workOrder.update({
          where: { id },
          data: { currentApprovalStep: workOrder.currentApprovalStep + 1 },
        });
      } else {
        return tx.workOrder.update({
          where: { id },
          data: { status: 'OPEN', currentApprovalStep: 0 },
        });
      }
    });
  }

  async verifyLOTO(workOrderId: string, data: AddLOTODto) {
    const userOrgId = TenancyContext.userOrgId;
    const organizationId = TenancyContext.organizationId || '';

    return this.prisma.$transaction(async (tx: any) => {
      const loto = await tx.workOrderLOTO.upsert({
        where: { workOrderId },
        update: {
          lockVerified: (data.locksApplied || 0) > 0,
          tagVerified: (data.tagsApplied || 0) > 0,
          energyVerified: data.energyIsolated || false,
          lockedById: userOrgId,
          lockedAt: new Date(),
        },
        create: {
          workOrderId,
          lockVerified: (data.locksApplied || 0) > 0,
          tagVerified: (data.tagsApplied || 0) > 0,
          energyVerified: data.energyIsolated || false,
          lockedById: userOrgId,
          lockedAt: new Date(),
          organizationId,
        },
      });

      await tx.workOrder.update({
        where: { id: workOrderId },
        data: { lotoVerified: true },
      });

      return loto;
    });
  }
}
