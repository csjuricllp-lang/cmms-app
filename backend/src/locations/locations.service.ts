import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { TenancyContext } from '../common/tenancy.context';

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  async create(createLocationDto: CreateLocationDto) {
    const { workerIds, teamIds, vendorIds, customerId, ...rest } = createLocationDto;
    const organizationId = TenancyContext.organizationId;
    
    return this.prisma.location.create({
      data: { 
        ...rest, 
        organizationId,
        workers: workerIds ? { connect: workerIds.map(id => ({ id })) } : undefined,
        teams: teamIds ? { connect: teamIds.map(id => ({ id })) } : undefined,
        vendors: vendorIds ? { connect: vendorIds.map(id => ({ id })) } : undefined,
        customers: customerId ? { connect: { id: customerId } } : undefined,
      } as any,
      include: { parent: true },
    });
  }

  /** Returns the full hierarchical tree of locations for the org */
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
  }) {
    const { search, sortBy, sortOrder = 'desc', workerIds, teamIds, statuses, priorities, types, customerId, vendorIds } = params || {};
    const organizationId = TenancyContext.organizationId;
    const where: any = { organizationId, deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (workerIds?.length) {
      where.workers = { some: { id: { in: workerIds } } };
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

    return this.prisma.location.findMany({
      where,
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { children: true, assets: true, workers: true, teams: true, vendors: true, customers: true } },
      },
      orderBy,
    });
  }

  /** Returns a single location with its full tree of children and assets */
  async findOne(id: string) {
    const organizationId = TenancyContext.organizationId;
    const location = await this.prisma.location.findFirst({
      where: { id, organizationId, deletedAt: null },
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
      throw new NotFoundException(`Location with ID ${id} not found`);
    }
    return location;
  }

  async addFile(locationId: string, file: Express.Multer.File) {
    await this.findOne(locationId);
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
    await this.findOne(id);
    const organizationId = TenancyContext.organizationId;
    const { workerIds, teamIds, vendorIds, customerId, ...rest } = updateLocationDto;

    return this.prisma.location.update({
      where: { id, organizationId },
      data: {
        ...rest,
        workers: workerIds ? { set: workerIds.map(id => ({ id })) } : undefined,
        teams: teamIds ? { set: teamIds.map(id => ({ id })) } : undefined,
        vendors: vendorIds ? { set: vendorIds.map(id => ({ id })) } : undefined,
        customers: customerId ? { set: [{ id: customerId }] } : (customerId === null ? { set: [] } : undefined),
      } as any,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    const organizationId = TenancyContext.organizationId;
    await this.prisma.location.update({
      where: { id, organizationId },
      data: { deletedAt: new Date() },
    });
    return { message: 'Location deleted successfully' };
  }
}

