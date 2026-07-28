import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkOrderStatus } from '@prisma/client';

@Injectable()
export class CustomStatusesService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.customStatus.findMany({
      where: { organizationId },
      orderBy: { label: 'asc' },
    });
  }

  async create(organizationId: string, data: { label: string, color: string, systemStatus: WorkOrderStatus }) {
    return this.prisma.customStatus.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async delete(id: string, organizationId: string) {
    const status = await this.prisma.customStatus.findFirst({
      where: { id, organizationId },
    });
    if (!status) throw new NotFoundException('Status not found');
    
    return this.prisma.customStatus.delete({
      where: { id },
    });
  }
}
