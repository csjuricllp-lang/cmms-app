import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  CreatePartDto, 
  UpdatePartDto, 
  AdjustStockDto, 
  AddInventoryLineDto, 
  UpdateInventoryLineDto 
} from './dto/part.dto';
import { TenancyContext } from '../common/tenancy.context';
import { PartQueryDto } from './dto/part-query.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { InventoryTransactionType, Prisma, Part } from '@prisma/client';

const PART_INCLUDES = {
  location: true,
  vendor: true,
  team: true,
  customer: true,
  assignedTo: { include: { user: true } },
  categoryRef: true,
  inventoryLines: { include: { location: true } },
} as const;

export type PartWithRelations = Prisma.PartGetPayload<{
  include: typeof PART_INCLUDES;
}>;

@Injectable()
export class PartsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(createPartDto: CreatePartDto): Promise<Part> {
    const organizationId = TenancyContext.organizationId || '';
    return this.prisma.part.create({
      data: {
        ...createPartDto,
        organizationId,
      } as any,
    });
  }

  async findAll(query?: PartQueryDto) {
    const organizationId = TenancyContext.organizationId;

    // --- High-Performance Server-Side Filtering & Pagination ---
    const { page, limit, search, status, criticality, locationId, categoryId } =
      query || {};

    const where: Prisma.PartWhereInput = {};

    if (status) {
      where.status = status.includes(',') 
        ? { in: status.split(',') as any } 
        : (status as any);
    }
    if (criticality) {
      where.criticality = criticality.includes(',') 
        ? { in: criticality.split(',') as any } 
        : (criticality as any);
    }
    if (locationId) {
      where.locationId = locationId.includes(',') 
        ? { in: locationId.split(',') } 
        : locationId;
    }
    if (categoryId) {
      where.categoryId = categoryId.includes(',') 
        ? { in: categoryId.split(',') } 
        : categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { partNumber: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const { sortBy, sortOrder } = query || {};
    
    let orderBy: any = { name: 'asc' };
    
    if (sortBy) {
        const order = sortOrder === 'desc' ? 'desc' : 'asc';
        
        switch (sortBy) {
            case 'date_created':
            case 'date created':
                orderBy = { createdAt: order };
                break;
            case 'allocated_qty':
            case 'allocated qty':
                 orderBy = { allocatedQty: order };
                 break;
            case 'incoming_qty':
            case 'incoming qty':
                 orderBy = { onOrderQuantity: order };
                 break;
            case 'barcode':
                 orderBy = { barcode: order };
                 break;
            case 'category':
                 orderBy = { categoryRef: { name: order } };
                 break;
            case 'critical':
                 orderBy = { criticality: order };
                 break;     
            default:
                 orderBy = { name: order };
                 break;
        }
    }

    // --- Backward Compatibility Guard ---
    if (!page && !limit && !search && !status && !sortBy) {
      return this.prisma.part.findMany({
        where,
        include: { 
            location: true,
            vendor: true,
            team: true,
            customer: true,
            assignedTo: { include: { user: true } },
            categoryRef: true,
            inventoryLines: { include: { location: true } }
        },
        orderBy,
      });
    }

    const currentPage = Number(page) || 1;
    const currentLimit = Number(limit) || 20;
    const skip = (currentPage - 1) * currentLimit;

    const [items, total] = await Promise.all([
      this.prisma.part.findMany({
        where,
        include: PART_INCLUDES as any,
        orderBy,
        skip,
        take: currentLimit,
      }),
      this.prisma.part.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page: currentPage,
        limit: currentLimit,
        totalPages: Math.ceil(total / currentLimit),
      },
    };
  }

  async findOne(id: string): Promise<PartWithRelations> {
    const organizationId = TenancyContext.organizationId;
    const part = await this.prisma.part.findFirst({
      where: { id, organizationId },
      include: { 
        location: true,
        vendor: true,
        team: true,
        customer: true,
        assignedTo: { include: { user: true } },
        categoryRef: true,
        attachments: true,
        inventoryLines: { 
          include: { 
            location: true,
            assetParts: {
              include: {
                asset: {
                   include: { location: true }
                }
              }
            },
            workOrderParts: {
              include: {
                workOrder: {
                  include: {
                    assignedTo: { include: { user: true } }
                  }
                }
              }
            }
          } 
        },
        assetParts: {
          include: {
            asset: {
              include: {
                location: true
              }
            }
          }
        },
        workOrderParts: {
          include: {
            workOrder: {
              include: {
                assignedTo: { include: { user: true } }
              }
            }
          }
        }
      },
    });
    if (!part) {
      throw new NotFoundException(`Part with ID ${id} not found`);
    }
    return part;
  }

  async findByBarcode(barcode: string): Promise<Part> {
    const organizationId = TenancyContext.organizationId;
    const part = await this.prisma.part.findFirst({
      where: { barcode, organizationId },
      include: { location: true },
    });
    if (!part) {
      throw new NotFoundException(`No part found with barcode: ${barcode}`);
    }
    return part;
  }

  async update(id: string, updatePartDto: UpdatePartDto): Promise<Part> {
    const organizationId = TenancyContext.organizationId;
    // findOne already verifies org ownership; this clause adds DB-level defense
    await this.findOne(id);
    return this.prisma.part.update({
      where: { id, organizationId },
      data: updatePartDto as any,
    });
  }

  async remove(id: string) {
    const organizationId = TenancyContext.organizationId;
    // findOne already verifies org ownership; this clause adds DB-level defense
    await this.findOne(id);
    await this.prisma.part.delete({
      where: { id, organizationId },
    });
    return { message: 'Part deleted successfully' };
  }

  async getTransactions(partId: string) {
    const organizationId = TenancyContext.organizationId;
    return this.prisma.inventoryTransaction.findMany({
      where: { partId, organizationId },
      include: { user: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async adjustStock(
    partId: string,
    quantity: number,
    type: InventoryTransactionType,
    referenceId?: string,
    notes?: string,
  ) {
    const organizationId = TenancyContext.organizationId;
    // In a real app, userId comes from the request context (JWT)
    // For now, we'll need to pass it or have a system user
    // Let's assume we handle this in the service call

    return this.prisma.$transaction(async (tx: any) => {
      const part = await tx.part.findUnique({ where: { id: partId } });
      if (!part) throw new NotFoundException('Part not found');

      const newTotal = part.quantity + quantity;
      if (newTotal < 0) throw new Error('Insufficient stock');

      const updatedPart = await tx.part.update({
        where: { id: partId },
        data: { quantity: newTotal },
      });

      // Trigger low stock alarm if below threshold!
      if (updatedPart.quantity <= updatedPart.minQuantity && quantity < 0) {
        this.notificationsService.notifyLowStock(updatedPart);
      }

      return tx.inventoryTransaction.create({
        data: {
          partId,
          quantity,
          type,
          referenceId,
          organizationId,
          userId: TenancyContext.userOrgId || 'SYSTEM',
        },
      });
    });
  }

  async addInventoryLine(partId: string, data: AddInventoryLineDto) {
    const organizationId = TenancyContext.organizationId;
    return this.prisma.inventoryLine.create({
      data: {
        ...data,
        partId,
        organizationId,
      },
    });
  }

  async updateInventoryLine(id: string, data: UpdateInventoryLineDto) {
    const organizationId = TenancyContext.organizationId;
    return this.prisma.inventoryLine.update({
      where: { id, organizationId },
      data,
    });
  }

  async removeInventoryLine(id: string) {
    const organizationId = TenancyContext.organizationId;
    return this.prisma.inventoryLine.delete({
      where: { id, organizationId },
    });
  }

  async linkAsset(partId: string, assetId: string, inventoryLineId?: string) {
    const organizationId = TenancyContext.organizationId;
    return this.prisma.assetPart.create({
      data: {
        partId,
        assetId,
        inventoryLineId,
        organizationId,
      },
    });
  }

  async unlinkAsset(id: string) {
    const organizationId = TenancyContext.organizationId;
    return this.prisma.assetPart.delete({
      where: { id, organizationId },
    });
  }

  async addFile(partId: string, fileInfo: any) {
    const userOrgId = TenancyContext.userOrgId;
    return this.prisma.partFile.create({
      data: {
        partId,
        filename: fileInfo.originalname,
        url: fileInfo.path,
        mimeType: fileInfo.mimetype,
        size: fileInfo.size,
        uploadedById: userOrgId || 'SYSTEM',
      },
    });
  }

  async removeFile(fileId: string) {
    const organizationId = TenancyContext.organizationId;
    // We should ideally check if the part belongs to the organization
    // But for now we'll do a one-off delete
    return this.prisma.partFile.delete({
      where: { id: fileId },
    });
  }

  async autoGroupParts(organizationId: string) {
    // 1. Fetch all active parts in this organization with a non-empty partNumber
    const parts = await this.prisma.part.findMany({
      where: {
        organizationId,
        deletedAt: null,
        NOT: [
          { partNumber: null },
          { partNumber: '' }
        ]
      },
      orderBy: { createdAt: 'asc' } // Oldest first
    });

    // 2. Group parts by partNumber
    const groups: Record<string, typeof parts> = {};
    for (const part of parts) {
      const pn = (part.partNumber || '').trim();
      if (!pn) continue;
      if (!groups[pn]) {
        groups[pn] = [];
      }
      groups[pn].push(part);
    }

    let groupsMergedCount = 0;
    let partsConsolidatedCount = 0;

    // 3. For each group with duplicates, merge them
    for (const pn of Object.keys(groups)) {
      const groupParts = groups[pn];
      if (groupParts.length < 2) continue;

      groupsMergedCount++;
      const [primaryPart, ...duplicateParts] = groupParts;

      await this.prisma.$transaction(async (tx) => {
        let totalQtyAccumulated = primaryPart.quantity;
        let totalAllocatedQtyAccumulated = primaryPart.allocatedQuantity;
        let updatedBarcode = primaryPart.barcode;
        let updatedCost = primaryPart.cost;
        let updatedDescription = primaryPart.description;
        let updatedBinLocation = primaryPart.binLocation;

        for (const duplicate of duplicateParts) {
          partsConsolidatedCount++;
          totalQtyAccumulated += duplicate.quantity;
          totalAllocatedQtyAccumulated += duplicate.allocatedQuantity;

          // Merge fields to primary if they are missing
          if (!updatedBarcode && duplicate.barcode) {
            updatedBarcode = duplicate.barcode;
            // Temporarily nullify duplicate barcode in transaction to avoid unique constraint error
            await tx.part.update({
              where: { id: duplicate.id },
              data: { barcode: null }
            });
          }
          if (!updatedCost && duplicate.cost) {
            updatedCost = duplicate.cost;
          }
          if (!updatedDescription && duplicate.description) {
            updatedDescription = duplicate.description;
          }
          if (!updatedBinLocation && duplicate.binLocation) {
            updatedBinLocation = duplicate.binLocation;
          }

          // Move relation links
          await tx.inventoryLine.updateMany({
            where: { partId: duplicate.id },
            data: { partId: primaryPart.id }
          });
          await tx.inventoryTransaction.updateMany({
            where: { partId: duplicate.id },
            data: { partId: primaryPart.id }
          });
          await tx.assetPart.updateMany({
            where: { partId: duplicate.id },
            data: { partId: primaryPart.id }
          });
          await tx.pMSchedulePlannedPart.updateMany({
            where: { partId: duplicate.id },
            data: { partId: primaryPart.id }
          });
          await tx.workOrderPlannedPart.updateMany({
            where: { partId: duplicate.id },
            data: { partId: primaryPart.id }
          });
          await tx.workOrderPart.updateMany({
            where: { partId: duplicate.id },
            data: { partId: primaryPart.id }
          });
          await tx.purchaseOrderItem.updateMany({
            where: { partId: duplicate.id },
            data: { partId: primaryPart.id }
          });
          await tx.partFile.updateMany({
            where: { partId: duplicate.id },
            data: { partId: primaryPart.id }
          });

          // Hard-delete the duplicate part
          await tx.part.delete({
            where: { id: duplicate.id }
          });
        }

        // Update the primary part with accumulated quantity and merged fields
        await tx.part.update({
          where: { id: primaryPart.id },
          data: {
            quantity: totalQtyAccumulated,
            allocatedQuantity: totalAllocatedQtyAccumulated,
            barcode: updatedBarcode,
            cost: updatedCost,
            description: updatedDescription,
            binLocation: updatedBinLocation
          }
        });
      });
    }

    return {
      success: true,
      groupsMerged: groupsMergedCount,
      partsConsolidated: partsConsolidatedCount
    };
  }

  async getPurchaseHistory(partId: string, organizationId: string) {
    // Fetch all PurchaseOrderItems for this part that belong to received/completed POs and have been received
    const items = await this.prisma.purchaseOrderItem.findMany({
      where: {
        partId,
        purchaseOrder: {
          organizationId,
          status: { in: ['RECEIVED', 'COMPLETED'] }
        },
        fulfilledQuantity: { gt: 0 }
      },
      include: {
        purchaseOrder: {
          include: {
            vendor: true
          }
        }
      },
      orderBy: {
        purchaseOrder: {
          createdAt: 'desc'
        }
      }
    });

    // Calculate average cost
    let totalQty = 0;
    let totalSpend = 0;

    const history = items.map(item => {
      const qty = item.fulfilledQuantity;
      const unitCost = Number(item.unitCost) || 0;
      const total = qty * unitCost;
      totalQty += qty;
      totalSpend += total;

      return {
        id: item.id,
        poId: item.purchaseOrder.id,
        poNumber: item.purchaseOrder.number || 'N/A',
        vendorName: item.purchaseOrder.vendor?.name || 'N/A',
        date: item.purchaseOrder.createdAt,
        quantity: qty,
        unitCost,
        total
      };
    });

    const averageCost = totalQty > 0 ? (totalSpend / totalQty) : null;

    return {
      averageCost,
      history
    };
  }

  async syncAllocatedQuantities(organizationId: string) {
    // 1. Fetch all active parts in this organization
    const parts = await this.prisma.part.findMany({
      where: {
        organizationId,
        deletedAt: null
      },
      select: {
        id: true
      }
    });

    // 2. Fetch all WorkOrderPart allocations for incomplete work orders
    const allocations = await this.prisma.workOrderPart.findMany({
      where: {
        part: {
          organizationId,
          deletedAt: null
        },
        workOrder: {
          deletedAt: null,
          status: {
            notIn: ['COMPLETED', 'CLOSED', 'CANCELLED']
          }
        }
      },
      select: {
        partId: true,
        quantity: true
      }
    });

    // 3. Group allocations by partId and sum
    const allocationMap: Record<string, number> = {};
    for (const alloc of allocations) {
      const q = Number(alloc.quantity) || 0;
      allocationMap[alloc.partId] = (allocationMap[alloc.partId] || 0) + q;
    }

    // 4. Update each part with its recalculated allocated quantity in a transaction
    await this.prisma.$transaction(
      parts.map(part => {
        const allocatedQty = allocationMap[part.id] || 0;
        return this.prisma.part.update({
          where: { id: part.id },
          data: {
            allocatedQuantity: Math.round(allocatedQty)
          }
        });
      })
    );

    return {
      success: true,
      partsSynced: parts.length
    };
  }
}
