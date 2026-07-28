import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenancyContext } from '../common/tenancy.context';
import { AddTimeLogDto } from './dto/add-time-log.dto';
import { AddExpenseDto } from './dto/add-expense.dto';
import { AddWorkOrderPartDto } from './dto/add-part.dto';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class WorkOrderFinanceService {
  private readonly logger = new Logger(WorkOrderFinanceService.name);

  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
  ) {}

  async addTimeLog(workOrderId: string, dto: AddTimeLogDto, currentLaborCost: any, currentActualHours: any, currentPartsCost: any, currentAdditionalCost: any) {
    const userOrgId = dto.userId || TenancyContext.userOrgId;

    let hourlyRate: Prisma.Decimal = new Prisma.Decimal(dto.hourlyRate ?? 0);
    if (dto.hourlyRate === undefined) {
      const userOrg = await this.prisma.userOrganization.findUnique({
        where: { id: userOrgId },
      });
      hourlyRate = new Prisma.Decimal(userOrg?.hourlyRate ?? 0);
    }
    
    const hoursLogged = new Prisma.Decimal(dto.hoursLogged);
    const totalCostLine = hoursLogged.mul(hourlyRate);

    return this.prisma.$transaction(async (tx: any) => {
      const timeLog = await tx.workOrderTimeLog.create({
        data: {
          workOrderId,
          userId: userOrgId,
          category: dto.category || null,
          hoursLogged: hoursLogged,
          hourlyRate: hourlyRate,
          totalCost: totalCostLine,
          description: dto.description || null,
          startTime: dto.startTime ? new Date(dto.startTime) : new Date(),
          endTime: dto.endTime ? new Date(dto.endTime) : null,
        },
      });

      const laborCost = new Prisma.Decimal(currentLaborCost || 0).plus(totalCostLine);
      const actualHours = new Prisma.Decimal(currentActualHours || 0).plus(hoursLogged);
      const totalCost = laborCost
        .plus(new Prisma.Decimal(currentPartsCost || 0))
        .plus(new Prisma.Decimal(currentAdditionalCost || 0));

      await tx.workOrder.update({
        where: { id: workOrderId },
        data: { 
          laborCost, 
          actualHours, 
          totalCost 
        },
      });

      return timeLog;
    });
  }

  async addExpense(workOrderId: string, dto: AddExpenseDto, currentLaborCost: any, currentPartsCost: any) {
    const userOrgId = dto.userId || TenancyContext.userOrgId;
    const expenseCost = new Prisma.Decimal(dto.cost);

    return this.prisma.$transaction(async (tx: any) => {
      const expense = await tx.workOrderExpense.create({
        data: {
          workOrderId,
          description: dto.description,
          category: dto.category,
          cost: expenseCost,
          userId: userOrgId,
          date: dto.date || new Date(),
        },
      });

      const allExpenses = await tx.workOrderExpense.findMany({
        where: { workOrderId },
        select: { cost: true },
      });
      
      const totalAdditional = allExpenses.reduce(
        (sum: Prisma.Decimal, e: any) => sum.plus(new Prisma.Decimal(e.cost)), 
        new Prisma.Decimal(0)
      );

      const labor = new Prisma.Decimal(currentLaborCost || 0);
      const parts = new Prisma.Decimal(currentPartsCost || 0);
      const total = labor.plus(parts).plus(totalAdditional);

      await tx.workOrder.update({
        where: { id: workOrderId },
        data: { 
          additionalCost: totalAdditional,
          totalCost: total
        },
      });

      return expense;
    });
  }

  async consumePart(workOrderId: string, dto: AddWorkOrderPartDto) {
    const userOrgId = TenancyContext.userOrgId;
    if (!userOrgId) {
      this.logger.warn(`No userOrgId in context for consumePart. Fallback to system-level assignment.`);
    }
    
    try {
      const part = await this.prisma.part.findUnique({
        where: { id: dto.partId },
      });
      if (!part) throw new NotFoundException('Part not found');

      const unitCost = new Prisma.Decimal(part.cost || 0);
      const quantity = new Prisma.Decimal(dto.quantity);
      const totalCostLine = quantity.mul(unitCost);

      const planned = await this.prisma.workOrderPlannedPart.findFirst({
        where: { workOrderId, partId: dto.partId },
      });

      const isAllocated = planned?.status === 'ALLOCATED';

      await this.inventoryService.adjustStock(
        dto.partId,
        -dto.quantity,
        'CONSUME',
        workOrderId,
        'Work Order Consumption',
        isAllocated,
      );

      if (isAllocated) {
        const plannedQty = new Prisma.Decimal(planned.quantity);
        if (plannedQty.lte(quantity)) {
          await this.prisma.workOrderPlannedPart.update({
            where: { id: planned.id },
            data: { status: 'CONSUMED', quantity: 0 },
          });
        } else {
          await this.prisma.workOrderPlannedPart.update({
            where: { id: planned.id },
            data: { quantity: { decrement: dto.quantity } },
          });
        }
      }

      const fallbackUser = await this.prisma.userOrganization.findFirst({ 
        where: { organizationId: TenancyContext.organizationId } 
      });

      const woPart = await this.prisma.workOrderPart.create({
        data: {
          workOrderId,
          partId: dto.partId,
          quantity: quantity,
          unitCost: unitCost,
          totalCost: totalCostLine,
          assignedById: userOrgId || fallbackUser?.id || '',
        },
      });

      await this.inventoryService.recalculateWorkOrderPartsCost(workOrderId);
      return woPart;
    } catch (error) {
      this.logger.error(`Failed to consume part for WO ${workOrderId}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
