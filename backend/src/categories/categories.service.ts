import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryType } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, type?: CategoryType) {
    return this.prisma.category.findMany({
      where: {
        OR: [{ organizationId }, { isSystem: true }],
        ...(type && { type }),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    return this.prisma.category.findFirst({
      where: { id, organizationId },
    });
  }

  async create(organizationId: string, data: any) {
    return this.prisma.category.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async delete(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.category.delete({
      where: { id },
    });
  }

  async update(id: string, organizationId: string, data: any) {
    await this.findOne(id, organizationId);
    return this.prisma.category.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.color !== undefined && { color: data.color }),
      },
    });
  }
}
