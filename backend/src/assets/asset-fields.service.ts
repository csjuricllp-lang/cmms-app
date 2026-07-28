import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssetFieldsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, entityType: string = 'ASSET') {
    return this.prisma.assetField.findMany({
      where: { 
        OR: [{ organizationId }, { isSystem: true }],
        entityType 
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(organizationId: string, data: any) {
    const existing = await this.prisma.assetField.findFirst({
      where: {
        label: data.label,
        entityType: data.entityType || 'ASSET',
        organizationId,
      },
    });

    if (existing) {
      throw new ConflictException('A field with this name already exists');
    }

    return this.prisma.assetField.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async remove(id: string, organizationId: string) {
    return this.prisma.assetField.deleteMany({
      where: { id, organizationId },
    });
  }
}
