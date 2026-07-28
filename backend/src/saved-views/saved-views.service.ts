import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSavedViewDto } from './dto/saved-view.dto';
import { TenancyContext } from '../common/tenancy.context';

@Injectable()
export class SavedViewsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateSavedViewDto) {
    const organizationId = TenancyContext.organizationId;
    
    try {
      return await this.prisma.savedView.create({
        data: {
          ...dto,
          userId,
          organizationId,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('A view with this name already exists for this entity.');
      }
      throw error;
    }
  }

  async findAll(userId: string, entityType: string) {
    const organizationId = TenancyContext.organizationId;
    return this.prisma.savedView.findMany({
      where: {
        organizationId,
        userId,
        entityType,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async remove(userId: string, id: string) {
    const organizationId = TenancyContext.organizationId;
    return this.prisma.savedView.delete({
      where: {
        id,
        organizationId,
        userId,
      },
    });
  }
}
