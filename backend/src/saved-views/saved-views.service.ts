import { Injectable, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSavedViewDto, UpdateSavedViewDto } from './dto/saved-view.dto';
import { TenancyContext } from '../common/tenancy.context';

@Injectable()
export class SavedViewsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, userRole: string, dto: CreateSavedViewDto) {
    const organizationId = TenancyContext.organizationId;

    // Only admins can create shared reports
    if (dto.isShared && !['ADMIN', 'LIMITED_ADMIN'].includes(userRole)) {
      throw new ForbiddenException('Only admins can create org-wide shared reports.');
    }

    try {
      return await this.prisma.savedView.create({
        data: {
          name: dto.name,
          description: dto.description,
          entityType: dto.entityType,
          config: dto.config,
          isShared: dto.isShared ?? false,
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
    // Return: user's own private reports OR any org-wide shared reports
    return this.prisma.savedView.findMany({
      where: {
        organizationId,
        entityType,
        OR: [
          { userId },
          { isShared: true },
        ],
      },
      orderBy: [
        { isShared: 'desc' }, // shared reports bubble to top
        { createdAt: 'desc' },
      ],
    });
  }

  async update(userId: string, userRole: string, id: string, dto: UpdateSavedViewDto) {
    const organizationId = TenancyContext.organizationId;

    const existing = await this.prisma.savedView.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== organizationId) {
      throw new NotFoundException('Saved view not found.');
    }

    // Only the owner or an admin can update
    const isAdmin = ['ADMIN', 'LIMITED_ADMIN'].includes(userRole);
    if (existing.userId !== userId && !isAdmin) {
      throw new ForbiddenException('You do not have permission to edit this report.');
    }

    // Only admins can toggle isShared
    if (dto.isShared !== undefined && !isAdmin) {
      throw new ForbiddenException('Only admins can share reports org-wide.');
    }

    return this.prisma.savedView.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.config !== undefined && { config: dto.config }),
        ...(dto.isShared !== undefined && isAdmin && { isShared: dto.isShared }),
      },
    });
  }

  async remove(userId: string, userRole: string, id: string) {
    const organizationId = TenancyContext.organizationId;

    const existing = await this.prisma.savedView.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== organizationId) {
      throw new NotFoundException('Saved view not found.');
    }

    // Only the owner or an admin can delete
    const isAdmin = ['ADMIN', 'LIMITED_ADMIN'].includes(userRole);
    if (existing.userId !== userId && !isAdmin) {
      throw new ForbiddenException('You do not have permission to delete this report.');
    }

    return this.prisma.savedView.delete({ where: { id } });
  }
}
