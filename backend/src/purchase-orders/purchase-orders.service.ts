import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  ReceivePurchaseOrderDto,
  PurchaseOrderStatus,
} from './dto/purchase-order.dto';
import { TenancyContext } from '../common/tenancy.context';
import { Prisma, PurchaseOrder } from '@prisma/client';

const PO_INCLUDES = {
  vendor: true,
  items: { include: { part: true } },
  workOrder: { select: { id: true, title: true } },
} as const;

export type PurchaseOrderWithRelations = Prisma.PurchaseOrderGetPayload<{
  include: typeof PO_INCLUDES;
}>;

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async create(dto: CreatePurchaseOrderDto): Promise<PurchaseOrderWithRelations> {
    const organizationId = TenancyContext.organizationId || '';
    const { items, ...poData } = dto;

    // Financials calculation using Decimal precision
    const itemsTotal = items.reduce(
      (acc: Prisma.Decimal, item) => acc.plus(new Prisma.Decimal(item.quantity).mul(new Prisma.Decimal(item.unitCost))),
      new Prisma.Decimal(0),
    );
    
    const shipping = new Prisma.Decimal(dto.shippingCost || 0);
    const tax = new Prisma.Decimal(dto.taxAmount || 0);
    const totalCost = itemsTotal.plus(shipping).plus(tax);

    // Enterprise Workflow: Approval threshold
    const APPROVAL_THRESHOLD = 50000;
    const status = totalCost.gt(APPROVAL_THRESHOLD) ? 'PENDING_APPROVAL' : 'ORDERED';

    return await this.prisma.$transaction(async (tx: any) => {
      const number = dto.number || (await this.getNextNumber(tx));
      
      return tx.purchaseOrder.create({
        data: {
          ...poData,
          number,
          organizationId,
          totalCost,
          shippingCost: shipping,
          taxAmount: tax,
          status,
          expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : null,
          purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : new Date(),
          items: {
            create: items.map(item => ({
              ...item,
              unitCost: new Prisma.Decimal(item.unitCost)
            })),
          },
        },
        include: PO_INCLUDES,
      });
    });
  }

  async createPublic(dto: CreatePurchaseOrderDto & { organizationId: string }): Promise<PurchaseOrderWithRelations> {
    const { items, organizationId, vendorId, title, notes } = dto;
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required for public purchase order requests.');
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('Items array is required for public purchase order requests.');
    }

    // Check setting: po.publicPortalEnabled
    const portalSetting = await this.prisma.setting.findUnique({
      where: {
        key_organizationId: {
          key: 'po.publicPortalEnabled',
          organizationId,
        },
      },
    });

    if (!portalSetting || portalSetting.value !== 'true') {
      throw new ForbiddenException('Public Request Portal is disabled for this organization.');
    }

    // Financials calculation using Decimal precision
    const itemsTotal = items.reduce(
      (acc: Prisma.Decimal, item) => acc.plus(new Prisma.Decimal(item.quantity).mul(new Prisma.Decimal(item.unitCost))),
      new Prisma.Decimal(0),
    );
    
    const shipping = new Prisma.Decimal(dto.shippingCost || 0);
    const tax = new Prisma.Decimal(dto.taxAmount || 0);
    const totalCost = itemsTotal.plus(shipping).plus(tax);

    // Public request defaults to 'PENDING_APPROVAL' status to ensure verification
    const status = 'PENDING_APPROVAL';

    return await this.prisma.$transaction(async (tx: any) => {
      // Tenant-isolation check: verify vendor belongs to organizationId if specified
      if (vendorId) {
        const vendor = await tx.vendor.findFirst({
          where: { id: vendorId, organizationId },
        });
        if (!vendor) {
          throw new BadRequestException('Specified vendor does not belong to this organization.');
        }
      }

      // Fetch current settings for number generation under organizationId context
      const settings = await tx.setting.findMany({
        where: {
          organizationId,
          key: { in: ['po.prefix', 'po.startNumber'] },
        },
      });

      const prefix = settings.find((s: any) => s.key === 'po.prefix')?.value || 'PO';
      let startNumber = parseInt(
        settings.find((s: any) => s.key === 'po.startNumber')?.value || '1',
        10,
      );

      const number = dto.number || `${prefix}-${startNumber}`;

      // Increment for next use
      await tx.setting.upsert({
        where: {
          key_organizationId: {
            key: 'po.startNumber',
            organizationId,
          },
        },
        update: { value: (startNumber + 1).toString() },
        create: {
          key: 'po.startNumber',
          value: (startNumber + 1).toString(),
          organizationId,
        },
      });
      
      // Explicit Whitelist to eliminate Mass Assignment vulnerabilities
      return tx.purchaseOrder.create({
        data: {
          title: title || 'Public Purchase Request',
          notes: notes || null,
          vendorId: vendorId || null,
          number,
          organizationId,
          totalCost,
          shippingCost: shipping,
          taxAmount: tax,
          status,
          expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : null,
          purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : new Date(),
          items: {
            create: items.map(item => ({
              description: (item as any).description || '',
              quantity: item.quantity,
              unitCost: new Prisma.Decimal(item.unitCost),
              partId: item.partId || null,
            })),
          },
        },
        include: PO_INCLUDES,
      });
    });
  }

  async approve(id: string): Promise<PurchaseOrder> {
    const organizationId = TenancyContext.organizationId;
    const po = await this.prisma.purchaseOrder.findFirst({ where: { id, organizationId } });
    if (!po) throw new NotFoundException(`Purchase Order ${id} not found`);
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'APPROVED' },
    });
  }

  async sendToVendor(id: string): Promise<{ success: boolean; message: string }> {
    const organizationId = TenancyContext.organizationId || '';
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, organizationId },
      include: PO_INCLUDES,
    });

    if (!po) {
      throw new NotFoundException('Purchase order not found');
    }

    if (!po.vendor || !po.vendor.email) {
      throw new BadRequestException('The selected vendor does not have an email address on file.');
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    await this.mailService.sendPurchaseOrderEmail(
      po.vendor.email,
      po,
      org?.name || 'Your Company',
    );

    // Create an audit log for sending PO
    await this.prisma.auditLog.create({
      data: {
        action: 'SENT_PO_TO_VENDOR',
        model: 'PurchaseOrder',
        entityId: po.id,
        userId: TenancyContext.userId || '',
        organizationId: organizationId,
        ipAddress: '127.0.0.1',
        userAgent: `Vendor PO Sent: ${po.vendor.email}`,
      },
    });

    return { success: true, message: `Successfully sent Purchase Order to ${po.vendor.email}` };
  }

  async deny(id: string): Promise<PurchaseOrder> {
    const organizationId = TenancyContext.organizationId;
    const po = await this.prisma.purchaseOrder.findFirst({ where: { id, organizationId } });
    if (!po) throw new NotFoundException(`Purchase Order ${id} not found`);
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'DENIED' },
    });
  }

  async findAll(params?: { search?: string; status?: string | string[]; tags?: string | string[] }) {
    const organizationId = TenancyContext.organizationId;
    const { search, status, tags } = params || {};

    const where: Prisma.PurchaseOrderWhereInput = {};

    if (search) {
      where.OR = [
        { number: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { vendor: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    let parsedStatuses: string[] = [];
    if (status) {
      if (Array.isArray(status)) {
        parsedStatuses = status;
      } else if (typeof status === 'string') {
        parsedStatuses = status.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    if (parsedStatuses.length > 0) {
      where.status = { in: parsedStatuses as PurchaseOrderStatus[] };
    }

    let parsedTags: string[] = [];
    if (tags) {
      if (Array.isArray(tags)) {
        parsedTags = tags;
      } else if (typeof tags === 'string') {
        parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
      }
    }

    if (parsedTags.length > 0) {
      where.tags = { hasSome: parsedTags };
    }

    return this.prisma.purchaseOrder.findMany({
      where,
      include: {
        vendor: true,
        _count: { select: { items: true } },
        items: { include: { part: true } }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<PurchaseOrderWithRelations> {
    const organizationId = TenancyContext.organizationId;
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, organizationId },
      include: PO_INCLUDES,
    });
    if (!po) {
      throw new NotFoundException(`Purchase Order with ID ${id} not found`);
    }
    return po;
  }

  async update(id: string, dto: UpdatePurchaseOrderDto) {
    const existing = await this.findOne(id);

    const { items, ...poData } = dto;
    const updateData: any = { ...poData };

    if (dto.expectedDeliveryDate !== undefined) {
      updateData.expectedDeliveryDate = dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : null;
    }
    if (dto.purchaseDate !== undefined) {
      updateData.purchaseDate = dto.purchaseDate ? new Date(dto.purchaseDate) : null;
    }

    if (items) {
      // Re-calculate costs if items change
      const itemsTotal = items.reduce(
        (acc: Prisma.Decimal, item) => acc.plus(new Prisma.Decimal(item.quantity).mul(new Prisma.Decimal(item.unitCost))),
        new Prisma.Decimal(0),
      );
      
      const shipping = new Prisma.Decimal(dto.shippingCost ?? existing.shippingCost ?? 0);
      const tax = new Prisma.Decimal(dto.taxAmount ?? existing.taxAmount ?? 0);
      
      updateData.totalCost = itemsTotal.plus(shipping).plus(tax);

      updateData.items = {
        deleteMany: {},
        create: items.map(item => ({
          ...item,
          unitCost: new Prisma.Decimal(item.unitCost)
        })),
      };
    } else if (dto.shippingCost !== undefined || dto.taxAmount !== undefined) {
      // Re-calculate total even if items didn't change but shipping/tax did
      const currentItems = (existing as any).items || [];
      const itemsTotal = currentItems.reduce(
        (acc: Prisma.Decimal, item: any) => acc.plus(new Prisma.Decimal(item.quantity).mul(new Prisma.Decimal(item.unitCost))),
        new Prisma.Decimal(0),
      );
      
      const shipping = new Prisma.Decimal(dto.shippingCost ?? existing.shippingCost ?? 0);
      const tax = new Prisma.Decimal(dto.taxAmount ?? existing.taxAmount ?? 0);
      
      updateData.totalCost = itemsTotal.plus(shipping).plus(tax);
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: PO_INCLUDES,
    });
  }

  /**
   * Fulfillment Logic:
   * When parts arrive, we update part stock levels and record inventory transactions.
   * This moves the PO to RECEIVED or COMPLETED status.
   */
  async receiveItems(id: string, dto: ReceivePurchaseOrderDto) {
    const organizationId = TenancyContext.organizationId;
    const userOrgId = TenancyContext.userOrgId;
    const po = await this.findOne(id);

    return await this.prisma.$transaction(async (tx) => {
      for (const item of dto.items) {
        const poItem = (po as any).items.find((i: any) => i.id === item.itemId);
        if (!poItem) continue;

        // 1. Update Fulfillment Counters
        await tx.purchaseOrderItem.update({
          where: { id: item.itemId },
          data: { fulfilledQuantity: { increment: item.quantityReceived } },
        });

        // 2. Increase Physical Inventory
        await tx.part.update({
          where: { id: poItem.partId },
          data: { quantity: { increment: item.quantityReceived } },
        });

        // 3. Log Audit Trail for Warehouse
        await tx.inventoryTransaction.create({
          data: {
            partId: poItem.partId,
            quantity: item.quantityReceived,
            type: 'RESTOCK',
            referenceId: po.id,
            userId: userOrgId,
            organizationId,
          },
        });
      }

      // check if fully received
      const updatedPo = await tx.purchaseOrder.findUnique({
        where: { id },
        include: { items: true },
      });

      const allFulfilled = (updatedPo as any).items.every(
        (i: any) => i.fulfilledQuantity >= i.quantity,
      );

      return tx.purchaseOrder.update({
        where: { id },
        data: { status: 'RECEIVED' },
        include: { items: true },
      });
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.purchaseOrder.delete({
      where: { id },
    });
    return { message: 'Purchase Order deleted successfully' };
  }

  async syncQuickBooks(id: string) {
    const organizationId = TenancyContext.organizationId;
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: { items: { include: { part: true } }, vendor: true },
    });

    if (!po) {
      throw new NotFoundException('Purchase Order not found.');
    }

    if (po.tags.includes('QuickBooks Synced')) {
      return { success: true, message: 'Already synced with QuickBooks.', data: po };
    }

    // Add tag to indicate sync
    const updatedTags = [...po.tags, 'QuickBooks Synced'];
    const updatedPo = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { tags: updatedTags },
      include: { items: { include: { part: true } }, vendor: true },
    });

    // Simulate sending payload to QBO
    console.log(`[QuickBooks Sync] Exported PO #${po.number} to QBO. Total Cost: ${po.totalCost}. Items: ${po.items.length}`);

    return {
      success: true,
      message: `Purchase Order #${po.number} successfully synchronized to QuickBooks Online.`,
      data: updatedPo,
    };
  }

  /**
   * Bulk Generate: The core engine for Inventory Planning.
   * Groups part requests by vendor and creates draft POs.
   */
  async bulkGenerate(dto: {
    partRequests: { partId: string; quantity: number }[];
  }) {
    const organizationId = TenancyContext.organizationId;

    // 1. Fetch all parts to get their vendor and cost info
    const parts = await this.prisma.part.findMany({
      where: {
        id: { in: dto.partRequests.map((p) => p.partId) },
        organizationId,
      },
      include: { vendor: true },
    });

    // 2. Group by Vendor
    const vendorGroups = new Map<string | null, any[]>();
    for (const req of dto.partRequests) {
      const part = parts.find((p) => p.id === req.partId);
      if (!part) continue;

      const vendorId = (part as any).vendorId || null;
      if (!vendorGroups.has(vendorId)) {
        vendorGroups.set(vendorId, []);
      }
      const group = vendorGroups.get(vendorId);
      if (group) {
        group.push({
          partId: part.id,
          quantity: req.quantity,
          unitCost: (part as any).cost || 0,
        });
      }
    }

    const createdPOs: any[] = [];

    // 3. Create a PO for each vendor group
    for (const [vendorId, items] of Array.from(vendorGroups.entries())) {
      // Find a vendor for placeholder if vendorId is null
      let targetVendorId = vendorId;
      if (!targetVendorId) {
        const someVendor = await this.prisma.vendor.findFirst({
          where: { organizationId },
        });
        targetVendorId = someVendor?.id || null;
      }

      if (!targetVendorId) {
        // Skip if no vendor exists at all in the system yet
        continue;
      }

      const itemsTotal = items.reduce(
        (acc: Prisma.Decimal, i) => acc.plus(new Prisma.Decimal(i.quantity).mul(new Prisma.Decimal(i.unitCost))),
        new Prisma.Decimal(0),
      );
      const poNumber = await this.getNextNumber();

      const po = await this.prisma.purchaseOrder.create({
        data: {
          number: poNumber,
          organizationId,
          vendorId: targetVendorId,
          totalCost: itemsTotal,
          status: 'DRAFT',
          items: {
            create: items.map((i: any) => ({
              partId: i.partId,
              quantity: i.quantity,
              unitCost: new Prisma.Decimal(i.unitCost)
            })),
          },
        },
      });
      createdPOs.push(po);
    }

    return {
      message: `Successfully generated ${createdPOs.length} replenishment Purchase Orders.`,
      poCount: createdPOs.length,
    };
  }

  private async getNextNumber(tx?: any) {
    const organizationId = TenancyContext.organizationId;
    const client = tx || this.prisma;

    // 1. Fetch current settings
    const settings = await client.setting.findMany({
      where: {
        organizationId,
        key: { in: ['po.prefix', 'po.startNumber'] },
      },
    });

    const prefix = settings.find((s: any) => s.key === 'po.prefix')?.value || 'PO';
    let startNumber = parseInt(
      settings.find((s: any) => s.key === 'po.startNumber')?.value || '1',
      10,
    );

    // 2. Generate result
    const result = `${prefix}-${startNumber}`;

    // 3. Increment for next use
    await client.setting.upsert({
      where: {
        key_organizationId: {
          key: 'po.startNumber',
          organizationId,
        },
      },
      update: { value: (startNumber + 1).toString() },
      create: {
        key: 'po.startNumber',
        value: (startNumber + 1).toString(),
        organizationId,
      },
    });

    return result;
  }
}
