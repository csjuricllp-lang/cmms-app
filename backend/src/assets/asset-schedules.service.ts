import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssetSchedulesService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.assetSchedule.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(organizationId: string, data: any) {
    const existing = await this.prisma.assetSchedule.findUnique({
      where: {
        name_organizationId: {
          name: data.name,
          organizationId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('A schedule with this name already exists');
    }

    return this.prisma.assetSchedule.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async remove(id: string, organizationId: string) {
    return this.prisma.assetSchedule.deleteMany({
      where: { id, organizationId },
    });
  }
}
