import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenancyContext } from '../common/tenancy.context';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { AddWorkOrderCommentDto } from './dto/add-comment.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class WorkOrderCollaborationService {
  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
  ) {}

  async addComment(workOrderId: string, dto: AddWorkOrderCommentDto) {
    const userOrgId = TenancyContext.userOrgId;

    const comment = await this.prisma.workOrderComment.create({
      data: {
        workOrderId,
        userId: userOrgId,
        text: dto.text,
      },
    });

    this.gateway.notifyWorkOrderComment(workOrderId, comment);
    return comment;
  }

  async addFile(workOrderId: string, file: Express.Multer.File) {
    const userOrgId = TenancyContext.userOrgId;

    return this.prisma.workOrderFile.create({
      data: {
        workOrderId,
        filename: file.originalname,
        url: `/files/${file.filename}`,
        mimeType: file.mimetype,
        size: file.size,
        uploadedById: userOrgId,
      },
    });
  }

  async share(id: string) {
    const organizationId = TenancyContext.organizationId || '';
    const shareToken = randomUUID();

    return this.prisma.workOrder.update({
      where: { id, organizationId },
      data: {
        isShared: true,
        shareToken,
      },
    });
  }

  async unshare(id: string) {
    const organizationId = TenancyContext.organizationId || '';
    return this.prisma.workOrder.update({
      where: { id, organizationId },
      data: {
        isShared: false,
        shareToken: null,
      },
    });
  }

  async removeFile(fileId: string) {
    return this.prisma.workOrderFile.delete({
      where: { id: fileId },
    });
  }
}
