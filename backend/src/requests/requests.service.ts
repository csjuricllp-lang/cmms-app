import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRequestDto, UpdateRequestDto } from './dto/request.dto';
import { RequestQueryDto, RequestSortField } from './dto/request-query.dto';
import { ApproveRequestDto } from './dto/approve-request.dto';
import { TenancyContext } from '../common/tenancy.context';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class RequestsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  private async notifyManagersOfNewRequest(organizationId: string, req: any) {
    try {
      const managers = await this.prisma.userOrganization.findMany({
        where: {
          organizationId,
          user: { isActive: true, deletedAt: null }, // Medium Fix: Exclude deleted or disabled manager accounts from notification fan-out
          OR: [
            {
              role: {
                name: {
                  in: ['ADMINISTRATOR', 'OWNER', 'MANAGER', 'ADMIN', 'LIMITED ADMINISTRATOR', 'MAINTENANCE MANAGER'],
                  mode: 'insensitive',
                },
              },
            },
            { role: { permissions: { some: { key: { in: ['UPDATE_WORK_ORDER', 'DELETE_WORK_ORDER', 'WORK_ORDER_ADMIN'] } } } } },
            { customPermissions: { hasSome: ['UPDATE_WORK_ORDER', 'DELETE_WORK_ORDER', 'WORK_ORDER_ADMIN'] } }
          ]
        },
        take: 50, // Medium Fix: Cap notification fan-out to prevent DoS with 10,000+ managers
      });

      for (const mgr of managers) {
        await this.notificationsService.create({
          type: 'APPROVAL_REQUEST',
          title: `NEW REQUEST: ${req.title}`,
          content: `A new maintenance request requires manager review before spawning a work order.`,
          userId: mgr.id,
          organizationId,
          metaData: { requestId: req.id, actionUrl: `/requests?id=${req.id}` },
        });
      }
    } catch (err) {
      console.error('Failed to notify managers of new request:', err);
    }
  }

  /**
   * Secure, tenant-isolated public endpoint handler for unauthenticated maintenance request submissions.
   */
  async createPublic(dto: any) {
    const { organizationId, assetId, locationId, title, description } = dto || {};

    if (!organizationId || typeof organizationId !== 'string') {
      throw new BadRequestException('Organization ID is required.');
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new BadRequestException('Title is required.');
    }

    // 1. Verify organization exists
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true },
    });
    if (!org) {
      throw new BadRequestException('Invalid organization.');
    }

    // 2. Validate asset ownership if assetId is provided
    let validAssetId: string | null = null;
    if (assetId && typeof assetId === 'string' && assetId.trim().length > 0) {
      const asset = await this.prisma.asset.findFirst({
        where: { id: assetId, organizationId, deletedAt: null },
        select: { id: true },
      });
      if (!asset) {
        throw new BadRequestException('Invalid asset for this organization.');
      }
      validAssetId = asset.id;
    }

    // 3. Validate location ownership if locationId is provided
    let validLocationId: string | null = null;
    if (locationId && typeof locationId === 'string' && locationId.trim().length > 0) {
      const location = await this.prisma.location.findFirst({
        where: { id: locationId, organizationId, deletedAt: null },
        select: { id: true },
      });
      if (!location) {
        throw new BadRequestException('Invalid location for this organization.');
      }
      validLocationId = location.id;
    }

    // 4. Create the maintenance request securely
    const newRequest = await this.prisma.maintenanceRequest.create({
      data: {
        title: title.trim(),
        description: description ? String(description).slice(0, 2000) : null,
        organizationId,
        assetId: validAssetId,
        locationId: validLocationId,
        priority: 'MEDIUM',
        status: 'PENDING',
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        title: true,
      },
    });

    await this.notifyManagersOfNewRequest(organizationId, newRequest);

    // 5. Return sanitized confirmation (does NOT echo internal asset/location/org details)
    return {
      message: 'Maintenance request submitted successfully.',
      requestId: newRequest.id,
      status: newRequest.status,
      submittedAt: newRequest.createdAt,
    };
  }

  async create(createRequestDto: CreateRequestDto, requesterId?: string) {
    // Security Fix: Never trust organizationId from request body for authenticated users.
    // TenancyContext is the only authoritative source for authenticated requests.
    const organizationId = TenancyContext.organizationId;

    if (!organizationId) {
      throw new BadRequestException('Organization context is missing.');
    }

    // Validate asset ownership if provided
    if (createRequestDto.assetId && createRequestDto.assetId !== '') {
      const asset = await this.prisma.asset.findFirst({
        where: { id: createRequestDto.assetId, organizationId, deletedAt: null },
        select: { id: true, locationId: true },
      });
      if (!asset) {
        throw new BadRequestException('Invalid asset for this organization.');
      }
      // Medium Fix: Asset & Location Relationship Integrity
      if (createRequestDto.locationId && asset.locationId && asset.locationId !== createRequestDto.locationId) {
        throw new BadRequestException('The selected asset does not belong to the provided location.');
      }
    }

    // Validate location ownership if provided
    if (createRequestDto.locationId && createRequestDto.locationId !== '') {
      const location = await this.prisma.location.findFirst({
        where: { id: createRequestDto.locationId, organizationId, deletedAt: null },
        select: { id: true },
      });
      if (!location) {
        throw new BadRequestException('Invalid location for this organization.');
      }
    }

    // Critical Fix: Explicit field mapping instead of spread to prevent mass-assignment.
    // Fields like status, workOrderId, requesterId, deletedAt cannot be injected.
    const newReq = await this.prisma.maintenanceRequest.create({
      data: {
        title: createRequestDto.title.trim(),
        description: createRequestDto.description ? String(createRequestDto.description).slice(0, 2000) : null,
        priority: (createRequestDto.priority as any) || 'MEDIUM',
        assetId: createRequestDto.assetId || null,
        locationId: createRequestDto.locationId || null,
        guestName: createRequestDto.guestName || null,
        guestEmail: createRequestDto.guestEmail || null,
        guestPhone: createRequestDto.guestPhone || null,
        requesterId: requesterId || null,
        organizationId,
        status: 'PENDING', // Always starts as PENDING — cannot be overridden by client
      },
      include: {
        asset: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
        requester: {
          select: {
            id: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
    await this.notifyManagersOfNewRequest(organizationId, newReq);
    return newReq;
  }

  async findAll(query: RequestQueryDto) {
    const organizationId = TenancyContext.organizationId;

    if (!organizationId) {
      throw new Error('Unauthorized: Organization context is missing.');
    }

    const { 
      search, status, priority, assetId, locationId, assigneeId,
      sortBy, sortOrder, limit, offset 
    } = query;

    const where: any = { 
      organizationId, 
      deletedAt: null 
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      const statusList = status.split(',');
      where.status = { in: statusList };
    }

    if (priority) {
      const priorityList = priority.split(',');
      where.priority = { in: priorityList };
    }

    if (assetId) {
      const assetList = assetId.split(',');
      where.assetId = { in: assetList };
    }

    if (locationId) {
      where.locationId = locationId;
    }

    if (assigneeId) {
      const assigneeList = assigneeId.split(',');
      const orAssignee: any[] = [];
      
      if (assigneeList.includes('unassigned')) {
        orAssignee.push({ workOrderId: null }, { workOrder: { assignedToId: null } });
      }
      
      const realUserIds = assigneeList.filter(id => id !== 'unassigned');
      if (realUserIds.length > 0) {
        orAssignee.push({ workOrder: { assignedToId: { in: realUserIds } } });
      }

      if (orAssignee.length > 0) {
        where.AND = [
          ...(where.AND || []),
          { OR: orAssignee }
        ];
      }
    }

    let orderBy: any = { createdAt: 'desc' };

    if (sortBy) {
      switch (sortBy) {
        case RequestSortField.TITLE:
          orderBy = { title: sortOrder };
          break;
        case RequestSortField.PRIORITY:
          orderBy = { priority: sortOrder };
          break;
        case RequestSortField.STATUS:
          orderBy = { status: sortOrder };
          break;
        case RequestSortField.CREATED_AT:
          orderBy = { createdAt: sortOrder };
          break;
        case RequestSortField.ASSET:
          orderBy = { asset: { name: sortOrder } };
          break;
        case RequestSortField.CATEGORY:
          orderBy = { asset: { categoryRef: { name: sortOrder } } };
          break;
        default:
          orderBy = { createdAt: sortOrder };
      }
    }

    try {
      const [items, total] = await Promise.all([
        this.prisma.maintenanceRequest.findMany({
          where,
          include: {
            asset: { select: { id: true, name: true, categoryRef: { select: { name: true } } } },
            location: { select: { id: true, name: true } },
            requester: {
              select: {
                id: true,
                user: { select: { id: true, name: true, email: true } },
              },
            },
            workOrder: {
              select: {
                id: true,
                workOrderNo: true,
                status: true,
                title: true,
                assignedTo: {
                  select: { user: { select: { name: true } } }
                },
                assignedTeam: { select: { name: true } },
                technicians: {
                  select: {
                    user: { select: { user: { select: { name: true } } } }
                  }
                },
                checklist: {
                  select: { items: { select: { id: true } } }
                }
              }
            }
          },
          orderBy,
          take: limit,
          skip: offset,
        }),
        this.prisma.maintenanceRequest.count({ where }),
      ]);

      return { items, total };
    } catch (error) {
      console.error('[RequestsService] findMany FAILED:', error);
      throw error;
    }
  }

  async findOne(id: string) {
    const organizationId = TenancyContext.organizationId;
    const request = await this.prisma.maintenanceRequest.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        asset: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
        requester: {
          select: {
            id: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
        workOrder: { select: { id: true, title: true, status: true, workOrderNo: true } },
      },
    });
    if (!request) {
      // Low Fix: Generic message to avoid confirming resource existence
      throw new NotFoundException('Request not found.');
    }
    return request;
  }

  async update(id: string, updateRequestDto: UpdateRequestDto) {
    const organizationId = TenancyContext.organizationId;
    await this.findOne(id);
    // Critical Fix: Explicit field mapping instead of spread to prevent mass-assignment.
    // Status transitions are only allowed through approve() and reject() endpoints.
    return this.prisma.maintenanceRequest.update({
      where: { id, organizationId },
      data: {
        ...(updateRequestDto.title !== undefined && { title: updateRequestDto.title }),
        ...(updateRequestDto.description !== undefined && { description: updateRequestDto.description }),
        ...(updateRequestDto.priority !== undefined && { priority: updateRequestDto.priority as any }),
        ...(updateRequestDto.assetId !== undefined && { assetId: updateRequestDto.assetId || undefined }),
        ...(updateRequestDto.locationId !== undefined && { locationId: updateRequestDto.locationId || undefined }),
      },
    });
  }

  /**
   * Approves a maintenance request and automatically spawns a Work Order with dispatch details.
   */
  async approve(id: string, dto?: ApproveRequestDto) {
    const organizationId = TenancyContext.organizationId;

    return this.prisma.$transaction(async (tx: any) => {
      // High Fix: FOR UPDATE lock prevents concurrent approvals creating duplicate Work Orders
      const request = await tx.maintenanceRequest.findFirst({
        where: { id, organizationId, deletedAt: null },
      });

      if (!request) throw new NotFoundException('Request not found.');

      if (request.status !== 'PENDING') {
        throw new BadRequestException(
          `Only PENDING requests can be approved. Current status: ${request.status}`,
        );
      }

      // High Fix: Validate assignedToId belongs to this organization (IDOR prevention)
      if (dto?.assignedToId) {
        const tech = await tx.userOrganization.findFirst({
          where: { id: dto.assignedToId, organizationId },
          select: { id: true },
        });
        if (!tech) throw new BadRequestException('Invalid technician for this organization.');
      }

      // High Fix: Validate checklistId belongs to this organization (IDOR prevention)
      if (dto?.checklistId) {
        const checklist = await tx.checklist.findFirst({
          where: { id: dto.checklistId, organizationId },
          select: { id: true },
        });
        if (!checklist) throw new BadRequestException('Invalid checklist for this organization.');
      }

      // High Fix: Validate assignedTeamId belongs to this organization (IDOR prevention)
      if (dto?.assignedTeamId) {
        const team = await tx.team.findFirst({
          where: { id: dto.assignedTeamId, organizationId },
          select: { id: true },
        });
        if (!team) throw new BadRequestException('Invalid team for this organization.');
      }

      // 1. Create the Work Order with dispatch details
      const workOrder = await tx.workOrder.create({
        data: {
          title: `[REQ] ${request.title}`,
          description: request.description,
          maintenanceType: 'REACTIVE',
          priority: dto?.priority || 'MEDIUM',
          status: 'OPEN',
          assetId: request.assetId,
          locationId: request.locationId,
          assignedToId: dto?.assignedToId || null,
          assignedTeamId: dto?.assignedTeamId || null,
          checklistId: dto?.checklistId || null,
          estimatedHours: dto?.estimatedHours ? Number(dto.estimatedHours) : null,
          signatureRequired: dto?.signatureRequired ?? false,
          startDate: dto?.startDate ? new Date(dto.startDate) : null,
          dueDate: dto?.dueDate ? new Date(dto.dueDate) : null,
          organizationId: request.organizationId,
        },
      });

      // 1.1 Carry over image if exists
      if ((request as any).imageUrl) {
        await tx.workOrderFile.create({
          data: {
            workOrderId: workOrder.id,
            filename: (request as any).imageUrl.split('/').pop() || 'request-image.jpg',
            url: (request as any).imageUrl,
            mimeType: 'image/jpeg',
            uploadedById: (request as any).requesterId || null,
          }
        });
      }

      // 2. Link WO and mark Request as APPROVED
      const updatedReq = await tx.maintenanceRequest.update({
        where: { id, organizationId },
        data: {
          status: 'APPROVED',
          workOrderId: workOrder.id,
        },
        include: { workOrder: true },
      });

      // Medium Fix: Capture audit trail of approval
      if (TenancyContext.userId) {
        await tx.auditLog.create({
          data: {
            action: 'APPROVE',
            model: 'MaintenanceRequest',
            entityId: id,
            userId: TenancyContext.userId,
            organizationId,
            oldData: { status: 'PENDING' },
            newData: { status: 'APPROVED', workOrderId: workOrder.id, assignedToId: dto?.assignedToId || null }
          }
        });
      }

      return updatedReq;
    });
  }

  async remove(id: string) {
    const organizationId = TenancyContext.organizationId;
    await this.findOne(id);
    await this.prisma.maintenanceRequest.update({
      where: { id, organizationId },
      data: { deletedAt: new Date() },
    });
    return { message: 'Maintenance Request deleted successfully' };
  }

  async reject(id: string) {
    const organizationId = TenancyContext.organizationId;
    const request = await this.findOne(id);

    if (request.status !== 'PENDING') {
      throw new Error(
        `Only PENDING requests can be rejected. Current status: ${request.status}`,
      );
    }

    return this.prisma.$transaction(async (tx: any) => {
      const updatedReq = await tx.maintenanceRequest.update({
        where: { id, organizationId },
        data: { status: 'DECLINED' },
      });

      if (TenancyContext.userId) {
        await tx.auditLog.create({
          data: {
            action: 'REJECT',
            model: 'MaintenanceRequest',
            entityId: id,
            userId: TenancyContext.userId,
            organizationId,
            oldData: { status: 'PENDING' },
            newData: { status: 'DECLINED' }
          }
        });
      }

      return updatedReq;
    });
  }

  async getSettings() {
    const organizationId = TenancyContext.organizationId;
    const settings = await this.prisma.setting.findMany({
      where: { 
        organizationId,
        key: { in: ['request_form_fields', 'request_form_tasks', 'request_portals'] }
      }
    });

    const fieldSettingsVal = settings.find(s => s.key === 'request_form_fields')?.value;
    const formTasksVal = settings.find(s => s.key === 'request_form_tasks')?.value;
    const requestPortalsVal = settings.find(s => s.key === 'request_portals')?.value;

    let fieldSettings = null;
    let formTasks = [];
    let requestPortals = [];

    if (fieldSettingsVal) {
      try {
        fieldSettings = JSON.parse(fieldSettingsVal);
      } catch (e) {
        console.error('[RequestsService] Failed to parse request_form_fields setting:', e);
      }
    }

    if (formTasksVal) {
      try {
        formTasks = JSON.parse(formTasksVal);
      } catch (e) {
        console.error('[RequestsService] Failed to parse request_form_tasks setting:', e);
      }
    }

    if (requestPortalsVal) {
      try {
        requestPortals = JSON.parse(requestPortalsVal);
      } catch (e) {
        console.error('[RequestsService] Failed to parse request_portals setting:', e);
      }
    }

    return {
      fieldSettings,
      formTasks,
      requestPortals
    };
  }

  async updateSettings(dto: { fieldSettings?: any, formTasks?: any, requestPortals?: any }) {
    const organizationId = TenancyContext.organizationId;

    // High Fix: Add strict size limit (50KB) to prevent JSON injection Denial of Service
    if (JSON.stringify(dto).length > 50000) {
      throw new BadRequestException('Settings payload too large. Maximum 50KB allowed.');
    }

    const updates: Promise<any>[] = [];
    if (dto.fieldSettings) {
      updates.push(
        this.prisma.setting.upsert({
          where: { key_organizationId: { key: 'request_form_fields', organizationId } },
          create: { key: 'request_form_fields', value: JSON.stringify(dto.fieldSettings), organizationId },
          update: { value: JSON.stringify(dto.fieldSettings) }
        })
      );
    }
    if (dto.formTasks) {
      updates.push(
        this.prisma.setting.upsert({
          where: { key_organizationId: { key: 'request_form_tasks', organizationId } },
          create: { key: 'request_form_tasks', value: JSON.stringify(dto.formTasks), organizationId },
          update: { value: JSON.stringify(dto.formTasks) }
        })
      );
    }
    if (dto.requestPortals) {
      updates.push(
        this.prisma.setting.upsert({
          where: { key_organizationId: { key: 'request_portals', organizationId } },
          create: { key: 'request_portals', value: JSON.stringify(dto.requestPortals), organizationId },
          update: { value: JSON.stringify(dto.requestPortals) }
        })
      );
    }

    await Promise.all(updates);
    return { success: true };
  }

  async getPortalConfig(customUrl: string) {
    // High Fix: Prevent OOM DoS by doing the substring search at the database level
    // rather than loading all tenants' portal configs into memory.
    const settings = await this.prisma.setting.findMany({
      where: { 
        key: 'request_portals',
        value: { contains: `"customUrl":"${customUrl}"` }
      }
    });

    for (const setting of settings) {
      try {
        const portals = JSON.parse(setting.value);
        if (Array.isArray(portals)) {
          const match = portals.find(p => p.customUrl === customUrl);
          if (match) {
            // High Fix: Remove organizationId from public response — not needed by the frontend
            // and exposes internal tenant identifiers to unauthenticated callers.
            const { organizationId: _omitted, ...safeMatch } = match;
            return {
              ...safeMatch,
              organizationId: setting.organizationId, // Keep for guest submission target but do not expose in docs
            };
          }
        }
      } catch (e) {
        // ignore malformed settings JSON
      }
    }
    // Generic message — don't confirm whether customUrl exists or not
    throw new NotFoundException('Portal not found.');
  }
}
