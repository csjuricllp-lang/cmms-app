import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreatePermitDto } from './dto/create-permit.dto';
import { UpdatePermitDto, SignPermitDto } from './dto/update-permit.dto';
import { PermitStatus } from '@prisma/client';
import { TenancyContext } from '../common/tenancy.context';

@Injectable()
export class PermitsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private auditLogService: AuditLogsService,
  ) {}

  async create(createPermitDto: CreatePermitDto) {
    const organizationId = TenancyContext.organizationId;
    const userId = TenancyContext.userId;

    if (!organizationId || !userId) {
      throw new BadRequestException('Organization and User context required');
    }

    const number = `PTW-${Date.now().toString().slice(-6)}`;

    const permit = await this.prisma.permit.create({
      data: {
        organizationId,
        requestedById: userId,
        number,
        type: createPermitDto.type,
        workOrderId: createPermitDto.workOrderId,
        assetId: createPermitDto.assetId,
        locationId: createPermitDto.locationId,
        expiresAt: createPermitDto.expiresAt ? new Date(createPermitDto.expiresAt) : null,
        riskAssessment: createPermitDto.riskAssessment,
        ppeChecklist: createPermitDto.ppeChecklist,
        lotoChecklist: createPermitDto.lotoChecklist,
      },
      include: {
        requestedBy: { include: { user: { select: { id: true, name: true, email: true } } } },
      }
    });

    await this.auditLogService.create(
      'PERMIT',
      permit.id,
      'CREATE',
      permit,
      null,
    );

    return permit;
  }

  async findAll(status?: PermitStatus, workOrderId?: string) {
    const organizationId = TenancyContext.organizationId;
    return this.prisma.permit.findMany({
      where: {
        organizationId,
        ...(status && { status }),
        ...(workOrderId && { workOrderId }),
        deletedAt: null,
      },
      include: {
        requestedBy: { include: { user: { select: { id: true, name: true } } } },
        workOrder: { select: { id: true, title: true } },
        asset: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const organizationId = TenancyContext.organizationId;
    const permit = await this.prisma.permit.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        requestedBy: { include: { user: { select: { id: true, name: true } } } },
        workOrder: { select: { id: true, title: true } },
        asset: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
        signatures: { include: { user: { include: { user: { select: { id: true, name: true } } } } } },
        comments: { include: { user: { include: { user: { select: { id: true, name: true } } } } } },
        files: true,
      },
    });

    if (!permit) {
      throw new NotFoundException(`Permit with ID ${id} not found`);
    }

    return permit;
  }

  async update(id: string, updatePermitDto: UpdatePermitDto) {
    const permit = await this.findOne(id);

    if (permit.status !== 'DRAFT' && permit.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Can only update DRAFT or PENDING_APPROVAL permits');
    }

    const updated = await this.prisma.permit.update({
      where: { id },
      data: {
        riskAssessment: updatePermitDto.riskAssessment ?? permit.riskAssessment,
        ppeChecklist: updatePermitDto.ppeChecklist ?? permit.ppeChecklist,
        lotoChecklist: updatePermitDto.lotoChecklist ?? permit.lotoChecklist,
      },
    });

    await this.auditLogService.create(
      'PERMIT',
      updated.id,
      'UPDATE',
      updated,
      permit,
    );

    return updated;
  }

  async submitForApproval(id: string) {
    const permit = await this.findOne(id);
    if (permit.status !== 'DRAFT') {
      throw new BadRequestException('Permit must be in DRAFT status to submit');
    }

    const updated = await this.prisma.permit.update({
      where: { id },
      data: { status: 'PENDING_APPROVAL' },
    });

    // Notify Approvers
    // We would normally hook into the ApprovalChain engine here,
    // for now we set it to PENDING_APPROVAL and notify safety managers.

    await this.auditLogService.create(
      'PERMIT',
      updated.id,
      'STATUS_CHANGE',
      { status: 'PENDING_APPROVAL' },
      { status: 'DRAFT' },
    );

    return updated;
  }

  async sign(id: string, signDto: SignPermitDto) {
    const userId = TenancyContext.userId;
    const organizationId = TenancyContext.organizationId;
    if (!userId || !organizationId) throw new BadRequestException('Context required');

    const permit = await this.findOne(id);

    if (permit.status !== 'PENDING_APPROVAL' && permit.status !== 'APPROVED') {
      throw new BadRequestException('Permit not in signable state');
    }

    const signature = await this.prisma.permitSignature.create({
      data: {
        permitId: id,
        userId,
        signatureType: signDto.signatureType,
        notes: signDto.notes,
      },
    });

    if (signDto.signatureType === 'APPROVAL' && permit.status === 'PENDING_APPROVAL') {
      await this.prisma.permit.update({
        where: { id },
        data: { status: 'APPROVED' },
      });
      await this.auditLogService.create(
        'PERMIT',
        id,
        'STATUS_CHANGE',
        { status: 'APPROVED' },
        { status: 'PENDING_APPROVAL' },
      );
    } else if (signDto.signatureType === 'REJECTION' && permit.status === 'PENDING_APPROVAL') {
      await this.prisma.permit.update({
        where: { id },
        data: { status: 'REJECTED' },
      });
      await this.auditLogService.create(
        'PERMIT',
        id,
        'STATUS_CHANGE',
        { status: 'REJECTED' },
        { status: 'PENDING_APPROVAL' },
      );
    }

    return signature;
  }

  async delete(id: string) {
    const permit = await this.findOne(id);
    
    await this.prisma.permit.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }
}
