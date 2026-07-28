import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVendorDto, UpdateVendorDto } from './dto/vendor.dto';
import { Vendor } from '@prisma/client';
import { TenancyContext } from '../common/tenancy.context';

@Injectable()
export class VendorsService {
  constructor(private prisma: PrismaService) {}

  async create(createVendorDto: CreateVendorDto): Promise<Vendor> {
    const organizationId = TenancyContext.organizationId || '';
    return this.prisma.vendor.create({
      data: {
        ...createVendorDto,
        organizationId,
      },
    });
  }

  async findAll(): Promise<Vendor[]> {
    const organizationId = TenancyContext.organizationId || '';
    return this.prisma.vendor.findMany({
      where: { organizationId },
      include: {
        files: true,
        workOrders: true,
        locations: true,
      },
    });
  }

  async findOne(id: string): Promise<Vendor> {
    const organizationId = TenancyContext.organizationId;
    const vendor = await this.prisma.vendor.findFirst({
      where: { id, organizationId },
      include: {
        files: true,
        workOrders: true,
        locations: true,
      },
    });
    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }
    return vendor;
  }

  async update(id: string, updateVendorDto: UpdateVendorDto): Promise<Vendor> {
    await this.findOne(id);
    return this.prisma.vendor.update({
      where: { id },
      data: updateVendorDto,
      include: {
        files: true,
        workOrders: true,
        locations: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.vendor.delete({ where: { id } });
    return { message: 'Vendor deleted successfully' };
  }

  async addFile(vendorId: string, fileInfo: any) {
    await this.findOne(vendorId);
    const userOrgId = TenancyContext.userOrgId;
    return this.prisma.vendorFile.create({
      data: {
        vendorId,
        filename: fileInfo.originalname,
        url: fileInfo.path,
        mimeType: fileInfo.mimetype,
        size: fileInfo.size,
        uploadedById: userOrgId || 'SYSTEM',
      },
    });
  }

  async removeFile(fileId: string) {
    return this.prisma.vendorFile.delete({
      where: { id: fileId },
    });
  }
}
