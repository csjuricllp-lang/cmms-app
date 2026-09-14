import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { TenancyContext } from '../common/tenancy.context';
import * as xlsx from 'xlsx';

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  private async logAudit(action: string, entityId: string, previousData: any, newData: any) {
    const userId = TenancyContext.userId;
    const organizationId = TenancyContext.organizationId;
    if (!userId || !organizationId) return;

    await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId,
        action,
        model: 'Location',
        entityId,
        oldData: previousData ? JSON.parse(JSON.stringify(previousData)) : undefined,
        newData: newData ? JSON.parse(JSON.stringify(newData)) : undefined,
      }
    });
  }

  private applyRBAC(where: any) {
    if (!TenancyContext.hasPermission('ALL')) {
      where.workers = { some: { id: TenancyContext.userOrgId } };
    }
  }

  async create(createLocationDto: CreateLocationDto) {
    const { workerIds, teamIds, vendorIds, customerId, parentId, ...rest } = createLocationDto;
    const organizationId = TenancyContext.organizationId;
    
    // Map User IDs to UserOrganization IDs since Location.workers relates to UserOrganization
    let userOrgIds: string[] = [];
    if (workerIds && workerIds.length > 0) {
      const userOrgs = await this.prisma.userOrganization.findMany({
        where: {
          organizationId,
          userId: { in: workerIds }
        },
        select: { id: true }
      });
      userOrgIds = userOrgs.map(uo => uo.id);
    }

    const created = await this.prisma.location.create({
      data: { 
        ...rest, 
        organizationId,
        parentId: parentId || undefined,
        workers: userOrgIds.length > 0 ? { connect: userOrgIds.map(id => ({ id })) } : undefined,
        teams: teamIds && teamIds.length > 0 ? { connect: teamIds.map(id => ({ id })) } : undefined,
        vendors: vendorIds && vendorIds.length > 0 ? { connect: vendorIds.map(id => ({ id })) } : undefined,
        customers: customerId ? { connect: { id: customerId } } : undefined,
      } as any,
      include: { parent: true },
    });

    await this.logAudit('CREATE', created.id, null, created);
    return created;
  }

  async findAll(params?: { 
    search?: string; 
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    workerIds?: string[];
    teamIds?: string[];
    statuses?: string[];
    priorities?: string[];
    types?: string[];
    customerId?: string;
    vendorIds?: string[];
    page?: number;
    limit?: number;
  }) {
    const { search, sortBy, sortOrder = 'desc', workerIds, teamIds, statuses, priorities, types, customerId, vendorIds, page, limit } = params || {};
    const organizationId = TenancyContext.organizationId;
    const where: any = { organizationId, deletedAt: null };

    this.applyRBAC(where);

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (workerIds?.length) {
      if (!where.workers) where.workers = {};
      where.workers.some = { ...where.workers.some, id: { in: workerIds } };
    }

    if (teamIds?.length) {
      where.teams = { some: { id: { in: teamIds } } };
    }

    if (statuses?.length) {
      where.status = { in: Array.isArray(statuses) ? statuses : [statuses] };
    }

    if (priorities?.length) {
      where.priority = { in: Array.isArray(priorities) ? priorities : [priorities] };
    }

    if (types?.length) {
      where.type = { in: Array.isArray(types) ? types : [types] };
    }

    if (customerId) {
        where.customers = { some: { id: customerId } };
    }

    if (vendorIds?.length) {
        where.vendors = { some: { id: { in: vendorIds } } };
    }

    let orderBy: any = { name: sortOrder };
    if (sortBy === 'Date Created') {
        orderBy = { createdAt: sortOrder };
    } else if (sortBy === 'Address') {
        orderBy = { address: sortOrder };
    } else if (sortBy === 'No. of Children') {
        orderBy = { children: { _count: sortOrder } };
    } else if (sortBy === 'Name') {
        orderBy = { name: sortOrder };
    }

    if (page && limit) {
      const skip = (page - 1) * limit;
      const [items, totalItems] = await Promise.all([
        this.prisma.location.findMany({
          where,
          include: {
            parent: { select: { id: true, name: true } },
            _count: { select: { children: true, assets: true, workers: true, teams: true, vendors: true, customers: true } },
          },
          orderBy,
          skip,
          take: Number(limit),
        }),
        this.prisma.location.count({ where })
      ]);

      return {
        items,
        meta: {
          totalItems,
          itemsPerPage: Number(limit),
          totalPages: Math.ceil(totalItems / Number(limit)),
          currentPage: Number(page),
        }
      };
    }

    const items = await this.prisma.location.findMany({
      where,
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { children: true, assets: true, workers: true, teams: true, vendors: true, customers: true } },
      },
      orderBy,
    });
    
    return {
      items,
      meta: {
        totalItems: items.length,
        itemsPerPage: items.length,
        totalPages: 1,
        currentPage: 1
      }
    };
  }

  async getBreadcrumbs(id: string) {
    const organizationId = TenancyContext.organizationId;
    const breadcrumbs: { id: string; name: string }[] = [];
    let currentId: string | null = id;

    // RBAC check on initial requested ID
    const initialLoc = await this.findOne(id).catch(() => null);
    if (!initialLoc) throw new ForbiddenException();

    while (currentId) {
      const loc = await this.prisma.location.findFirst({
        where: { id: currentId, organizationId, deletedAt: null },
        select: { id: true, name: true, parentId: true },
      });

      if (!loc) break;
      
      breadcrumbs.unshift({ id: loc.id, name: loc.name });
      currentId = loc.parentId;
    }

    return breadcrumbs;
  }

  async getRollupMetrics(id: string) {
    const orgId = TenancyContext.organizationId;
    
    // RBAC check
    await this.findOne(id);
    
    // Recursive CTE to get all child location IDs
    const hierarchyQuery: any[] = await this.prisma.$queryRaw`
      WITH RECURSIVE LocationHierarchy AS (
        SELECT id FROM "Location" 
        WHERE id = ${id} AND "organizationId" = ${orgId}
        UNION ALL
        SELECT l.id FROM "Location" l
        INNER JOIN LocationHierarchy lh ON l."parentId" = lh.id
        WHERE l."deletedAt" IS NULL
      )
      SELECT id FROM LocationHierarchy;
    `;

    const locationIds = hierarchyQuery.map((row) => row.id);

    if (locationIds.length === 0) {
      return { totalAssets: 0, totalWorkOrders: 0, openWorkOrders: 0 };
    }

    const [totalAssets, totalWorkOrders, openWorkOrders] = await Promise.all([
      this.prisma.asset.count({
        where: { locationId: { in: locationIds }, deletedAt: null }
      }),
      this.prisma.workOrder.count({
        where: { locationId: { in: locationIds }, deletedAt: null }
      }),
      this.prisma.workOrder.count({
        where: { 
          locationId: { in: locationIds }, 
          status: { in: ['OPEN', 'IN_PROGRESS', 'ON_HOLD'] },
          deletedAt: null 
        }
      })
    ]);

    return {
      totalAssets,
      totalWorkOrders,
      openWorkOrders,
      descendantLocationCount: locationIds.length - 1
    };
  }

  async findOne(id: string) {
    const organizationId = TenancyContext.organizationId;
    const where: any = { id, organizationId, deletedAt: null };
    this.applyRBAC(where);

    const location = await this.prisma.location.findFirst({
      where,
      include: {
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true, type: true } },
        assets: {
          select: { id: true, name: true, status: true, criticality: true, imageUrl: true },
        },
        workers: { select: { id: true, user: { select: { id: true, name: true } } } },
        teams: { select: { id: true, name: true } },
        vendors: { select: { id: true, name: true } },
        customers: { select: { id: true, name: true } },
        workOrders: {
            select: { id: true, title: true, status: true, priority: true, dueDate: true, workOrderNo: true }
        },
        files: { orderBy: { createdAt: 'desc' } },
        parts: {
            select: { id: true, name: true, partNumber: true, quantity: true, cost: true, status: true }
        }
      },
    });
    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found or access denied`);
    }
    return location;
  }

  async addFile(locationId: string, file: Express.Multer.File) {
    await this.findOne(locationId); // Enforces RBAC
    const userOrgId = TenancyContext.userOrgId;

    return this.prisma.locationFile.create({
      data: {
        locationId,
        filename: file.originalname,
        url: `/files/${file.filename}`,
        mimeType: file.mimetype,
        size: file.size,
        uploadedById: userOrgId,
      },
    });
  }

  async removeFile(locationId: string, fileId: string) {
    await this.findOne(locationId); // Enforces RBAC
    const file = await this.prisma.locationFile.findFirst({
      where: { id: fileId, locationId },
    });

    if (!file) {
      throw new NotFoundException('File not found on this location');
    }

    await this.prisma.locationFile.delete({ where: { id: fileId } });
    return { message: 'File removed successfully' };
  }

  async update(id: string, updateLocationDto: UpdateLocationDto) {
    const existing = await this.findOne(id); // Enforces RBAC
    const orgId = TenancyContext.organizationId;
    
    if (updateLocationDto.version !== undefined) {
      if (existing.version !== updateLocationDto.version) {
        throw new ConflictException(`Location has been modified by someone else. Please refresh and try again. (v${existing.version} vs v${updateLocationDto.version})`);
      }
    }

    const { workerIds, teamIds, vendorIds, customerId, parentId, ...rest } = updateLocationDto;
    
    let userOrgIds: string[] = [];
    if (workerIds && workerIds.length > 0) {
      const userOrgs = await this.prisma.userOrganization.findMany({
        where: {
          organizationId: orgId,
          userId: { in: workerIds }
        },
        select: { id: true }
      });
      userOrgIds = userOrgs.map(uo => uo.id);
    }

    const updated = await this.prisma.location.update({
      where: { id, organizationId: orgId },
      data: {
        ...rest,
        version: { increment: 1 },
        parentId: parentId || undefined,
        workers: workerIds !== undefined ? { set: userOrgIds.map(id => ({ id })) } : undefined,
        teams: teamIds !== undefined ? { set: teamIds.map(id => ({ id })) } : undefined,
        vendors: vendorIds !== undefined ? { set: vendorIds.map(id => ({ id })) } : undefined,
        customers: customerId !== undefined ? (customerId ? { set: [{ id: customerId }] } : { set: [] }) : undefined,
      } as any,
      include: { parent: true },
    });

    await this.logAudit('UPDATE', updated.id, existing, updated);
    return updated;
  }

  async remove(id: string) {
    const existing = await this.findOne(id); // Enforces RBAC
    const orgId = TenancyContext.organizationId;
    
    // Cascading soft deletes
    const hierarchyQuery: any[] = await this.prisma.$queryRaw`
      WITH RECURSIVE LocationHierarchy AS (
        SELECT id FROM "Location" 
        WHERE id = ${id} AND "organizationId" = ${orgId}
        UNION ALL
        SELECT l.id FROM "Location" l
        INNER JOIN LocationHierarchy lh ON l."parentId" = lh.id
        WHERE l."deletedAt" IS NULL
      )
      SELECT id FROM LocationHierarchy;
    `;
    const descendantIds = hierarchyQuery.map((row) => row.id);

    const now = new Date();

    // Soft delete locations
    await this.prisma.location.updateMany({
      where: { id: { in: descendantIds } },
      data: { deletedAt: now }
    });

    // Soft delete assets
    await this.prisma.asset.updateMany({
      where: { locationId: { in: descendantIds }, deletedAt: null },
      data: { deletedAt: now }
    });

    // Cancel Work Orders
    await this.prisma.workOrder.updateMany({
      where: { locationId: { in: descendantIds }, deletedAt: null },
      data: { status: 'CANCELLED', deletedAt: now }
    });

    // Inactivate PM Schedules
    await this.prisma.pMSchedule.updateMany({
      where: { locationId: { in: descendantIds }, deletedAt: null },
      data: { isActive: false, deletedAt: now }
    });

    await this.logAudit('DELETE', id, existing, null);
    return { message: 'Location and its dependents deleted successfully' };
  }

  async importCsv(file: Express.Multer.File) {
    const orgId = TenancyContext.organizationId;
    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data: any[] = xlsx.utils.sheet_to_json(sheet);

    let importedCount = 0;
    for (const row of data) {
      if (!row.name) continue;
      await this.prisma.location.create({
        data: {
          organizationId: orgId,
          name: row.name,
          description: row.description,
          address: row.address,
          type: row.type || 'BUILDING',
        } as any
      });
      importedCount++;
    }
    return { message: `Successfully imported ${importedCount} locations.` };
  }

  async exportCsv() {
    const orgId = TenancyContext.organizationId;
    const where: any = { organizationId: orgId, deletedAt: null };
    this.applyRBAC(where);

    const locations = await this.prisma.location.findMany({ where });
    const data = locations.map(l => ({
      ID: l.id,
      Name: l.name,
      Type: l.type,
      Address: l.address,
      Description: l.description,
      CreatedAt: l.createdAt
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Locations');
    return xlsx.write(workbook, { type: 'buffer', bookType: 'csv' });
  }
}
