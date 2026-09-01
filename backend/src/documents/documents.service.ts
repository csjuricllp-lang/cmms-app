import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, userId: string, dto: CreateDocumentDto) {
    return this.prisma.document.create({
      data: {
        filename: dto.filename,
        url: dto.url,
        mimeType: dto.mimeType,
        size: dto.size,
        tags: dto.tags || [],
        organizationId,
        uploadedById: userId,
      },
      include: {
        uploadedBy: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                name: true,
                avatarUrl: true,
              }
            }
          }
        }
      }
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.document.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                name: true,
                avatarUrl: true,
              }
            }
          }
        }
      }
    });
  }

  async remove(id: string, organizationId: string) {
    const doc = await this.prisma.document.findFirst({
      where: { id, organizationId }
    });

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    return this.prisma.document.delete({
      where: { id }
    });
  }
}
