import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, model?: string) {
    return this.prisma.tag.findMany({
      where: {
        organizationId,
        ...(model && { model }),
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(organizationId: string, data: any) {
    return this.prisma.tag.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async delete(id: string, organizationId: string) {
    return this.prisma.tag.delete({
      where: { id },
    });
  }
}
