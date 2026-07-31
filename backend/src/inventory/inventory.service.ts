import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenancyContext } from '../common/tenancy.context';
import { InventoryTransactionType, Prisma } from '@prisma/client';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    private prisma: PrismaService,
    @Inject('BullQueue_inventory') private inventoryQueue: any,
  ) {}

  /**
   * Main entry point for adjusting stock (atomic update + audit log)
   */
  async adjustStock(
    partId: string,
    quantityDelta: number,
    type: InventoryTransactionType,
    referenceId?: string,
    reason?: string,
    isAllocated?: boolean,
  ) {
    const userId = TenancyContext.userOrgId || '';
    const organizationId = TenancyContext.organizationId || '';

    try {
      return await this.prisma.$transaction(async (tx) => {
        const allocationUpdate = isAllocated
          ? { allocatedQuantity: { decrement: Math.abs(quantityDelta) } }
          : {};

        // 1. Atomic Conditional Update: Lock & decrement in a single SQL operation to eliminate TOCTOU race conditions
        if (quantityDelta < 0) {
          const needed = Math.abs(quantityDelta);
          const updateResult = await tx.part.updateMany({
            where: {
              id: partId,
              organizationId,
              quantity: { gte: needed },
            },
            data: {
              quantity: { increment: quantityDelta },
              ...allocationUpdate,
            },
          });

          if (updateResult.count === 0) {
            const part = await tx.part.findFirst({ where: { id: partId, organizationId } });
            if (!part) throw new NotFoundException('Part not found');
            throw new BadRequestException(
              `Insufficient stock for ${part.name}. Available: ${part.quantity}, requested change: ${quantityDelta}.`,
            );
          }
        } else {
          // Increment or neutral adjustment
          const updateResult = await tx.part.updateMany({
            where: { id: partId, organizationId },
            data: {
              quantity: { increment: quantityDelta },
              ...allocationUpdate,
            },
          });

          if (updateResult.count === 0) {
            throw new NotFoundException('Part not found');
          }
        }

        // Fetch updated state atomically post-mutation
        const updatedPart = await tx.part.findFirst({
          where: { id: partId, organizationId },
        });

        if (!updatedPart) throw new NotFoundException('Part not found');
        console.log('adjustStock: updatedPart found', updatedPart.quantity);

        // 4. Create Audit Transaction
        const newTx = await tx.inventoryTransaction.create({
          data: {
            partId,
            quantity: quantityDelta,
            type,
            referenceId,
            userId: TenancyContext.userOrgId || '',
            organizationId,
          },
        });

        // CTO Governance: Global Audit Log
        await (tx as any).auditLog
          .create({
            data: {
              action: `INVENTORY_${type}`,
              model: 'Part',
              entityId: partId,
              userId: TenancyContext.userId || null,
              organizationId,
              oldData: { quantity: updatedPart.quantity - quantityDelta },
              newData: { quantity: updatedPart.quantity },
            },
          })
          .catch((e: Error) => this.logger.warn(`Failed to create CTO audit log: ${e.message}`));

        // 5. Trigger Low Stock Check Check (Background)
        if (updatedPart.quantity <= updatedPart.minQuantity) {
          await this.inventoryQueue.add('low-stock-alert', {
            partId,
            organizationId,
            currentQuantity: updatedPart.quantity,
            minQuantity: updatedPart.minQuantity,
          });
        }

        return { newTx, updatedPart };
      });
    } catch (error) {
      this.logger.error(`Error adjusting stock for part ${partId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Recalculates total parts cost for a Work Order
   */
  async recalculateWorkOrderPartsCost(workOrderId: string) {
    const parts = await this.prisma.workOrderPart.findMany({
      where: { workOrderId },
    });

    const totalCost = parts.reduce(
      (sum, p) => sum.plus(new Prisma.Decimal(p.totalCost || 0)),
      new Prisma.Decimal(0),
    );

    await this.prisma.workOrder.update({
      where: { id: workOrderId },
      data: { partsCost: totalCost },
    });

    // Note: Re-calculating workOrder.totalCost can also be done here or via events
    this.logger.log(
      `Recalculated parts cost for WO ${workOrderId}: $${totalCost}`,
    );
    return totalCost;
  }

  /**
   * Reserve parts for a Work Order without deducting from "Total Oh Hand"
   * Moves "Available" to "Allocated"
   */
  async allocatePart(workOrderId: string, partId: string, quantity: number) {
    const organizationId = TenancyContext.organizationId || '';

    return this.prisma.$transaction(async (tx) => {
      const part = await tx.part.findFirst({ where: { id: partId, organizationId } });
      if (!part) throw new NotFoundException('Part not found');

      const available = part.quantity - part.allocatedQuantity;
      if (available < quantity) {
        throw new BadRequestException(
          `Insufficient availability for ${part.name}. Available: ${available}`,
        );
      }

      // 1. Update Allocation
      await tx.part.update({
        where: { id: partId },
        data: { allocatedQuantity: { increment: quantity } },
      });

      // 2. Create Planning Record
      return (tx as any).workOrderPlannedPart.upsert({
        where: { workOrderId_partId: { workOrderId, partId } },
        update: { quantity: { increment: quantity }, status: 'ALLOCATED' },
        create: {
          workOrderId,
          partId,
          quantity,
          status: 'ALLOCATED',
          organizationId,
        },
      });
    });
  }
}
