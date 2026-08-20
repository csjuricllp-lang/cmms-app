import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkOrderDto, UpdateWorkOrderDto } from './dto/work-order.dto';
import { AddWorkOrderCommentDto } from './dto/add-comment.dto';
import { AddWorkOrderPartDto } from './dto/add-part.dto';
import { AddTimeLogDto } from './dto/add-time-log.dto';
import { AddExpenseDto } from './dto/add-expense.dto';
import { AddWorkOrderPartsDto } from './dto/add-parts.dto';
import { AddChecklistResponseDto } from './dto/add-checklist-response.dto';
import { AddLOTODto } from './dto/add-loto.dto';
import { AddLinkDto } from './dto/add-link.dto';
import { SmartScheduleDto } from './dto/smart-schedule.dto';
import { DeferWorkOrderDto } from './dto/defer-work-order.dto';
import { TenancyContext } from '../common/tenancy.context';
import { AppEvents, WorkOrderCreatedPayload, WorkOrderStatusUpdatedPayload, WorkOrderCompletedPayload } from '../events/app-events';
import { PreventiveMaintenanceService } from '../preventive-maintenance/preventive-maintenance.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';
import { Permissions } from '../auth/permissions/permissions.constants';
import twilio = require('twilio');

import { EventEmitter2 } from '@nestjs/event-emitter';
import { SLAService } from '../sla/sla.service';
import { InventoryService } from '../inventory/inventory.service';
import { ChecklistsService } from '../checklists/checklists.service';
import { WorkOrderQueryDto } from './dto/work-order-query.dto';
import { WorkOrderLifecycleService } from './work-order-lifecycle.service';
import { WorkOrderFinanceService } from './work-order-finance.service';
import { WorkOrderCollaborationService } from './work-order-collaboration.service';
import { WorkOrderSchedulerService } from './work-order-scheduler.service';
import { SettingsService } from '../settings/settings.service';

import { Prisma, WorkOrder } from '@prisma/client';

const WO_INCLUDES = {
  asset: { select: { id: true, name: true, status: true, criticality: true } },
  location: { select: { id: true, name: true } },
  assignedTo: {
    include: { user: { select: { id: true, name: true, email: true } } },
  },
  assignedTeam: { select: { id: true, name: true } },
  checklist: { select: { id: true, title: true } },
  vendor: { select: { id: true, name: true } },
  parentWorkOrder: { select: { id: true, title: true } },
  request: {
    include: {
      requester: {
        include: { user: { select: { name: true } } }
      }
    }
  },
  lotoAudit: {
    select: {
      id: true,
      lockVerified: true,
      tagVerified: true,
      energyVerified: true,
      createdAt: true,
    },
  },
  technicians: {
    include: {
      user: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  },
  customStatus: {
    select: { id: true, label: true, color: true, systemStatus: true },
  },
  approvals: {
    include: {
      user: {
        include: {
          user: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  },
  linkedWorkOrders: {
    include: {
      targetWorkOrder: { select: { id: true, title: true, workOrderNo: true, status: true } }
    }
  },
  linkedFromOrders: {
    include: {
      sourceWorkOrder: { select: { id: true, title: true, workOrderNo: true, status: true } }
    }
  }
} as const;

export type WorkOrderWithRelations = Prisma.WorkOrderGetPayload<{
  include: typeof WO_INCLUDES;
}>;

const WO_DETAILED_INCLUDES = {
  ...WO_INCLUDES,
  checklist: { include: { items: true } },
  comments: {
    include: {
      user: { include: { user: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  },
  timeLogs: {
    include: {
      user: { include: { user: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  },
  files: { orderBy: { createdAt: 'desc' } },
  partsUsed: {
    include: {
      part: {
        select: {
          id: true,
          name: true,
          partNumber: true,
          status: true,
          minQuantity: true,
          quantity: true,
          location: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  },
  plannedParts: {
    include: {
      part: {
        select: {
          id: true,
          name: true,
          partNumber: true,
          status: true,
          minQuantity: true,
          quantity: true,
          location: { select: { id: true, name: true } },
        },
      },
    },
  },
  checklistResponses: true,
} as const;

export type WorkOrderDetailed = Prisma.WorkOrderGetPayload<{
  include: typeof WO_DETAILED_INCLUDES;
}>;

@Injectable()
export class WorkOrdersService {
  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
    private notificationsService: NotificationsService,
    private eventEmitter: EventEmitter2,
    private slaService: SLAService,
    private inventoryService: InventoryService,
    private checklistsService: ChecklistsService,
    private lifecycleService: WorkOrderLifecycleService,
    private financeService: WorkOrderFinanceService,
    private collaborationService: WorkOrderCollaborationService,
    private schedulerService: WorkOrderSchedulerService,
    private settingsService: SettingsService,
    private mailService: MailService,
  ) {}

  private readonly logger = new Logger(WorkOrdersService.name);

  async create(createWorkOrderDto: CreateWorkOrderDto): Promise<WorkOrderWithRelations> {
    const {
      technicianIds,
      customStatusId,
      approvalChainId,
      tasks,
      parts,
      assetId,
      locationId,
      ...rest
    } = createWorkOrderDto;

    // Validate asset and location existence if provided
    if (assetId) {
      const asset = await this.prisma.asset.findUnique({
        where: { id: assetId },
        select: { id: true },
      });
      if (!asset) {
        throw new NotFoundException(`Asset with id ${assetId} not found`);
      }
    }
    if (locationId) {
      const location = await this.prisma.location.findUnique({
        where: { id: locationId },
        select: { id: true },
      });
      if (!location) {
        throw new NotFoundException(`Location with id ${locationId} not found`);
      }
    }

    const organizationId = TenancyContext.organizationId || '';
    const userId = TenancyContext.userId;
    const priority = createWorkOrderDto.priority || 'MEDIUM';

    // --- SLA: Fetch Vendor & Calculate Targets ---
    let vendorData: any = undefined;
    if (createWorkOrderDto.vendorId) {
      vendorData =
        (await this.prisma.vendor.findUnique({
          where: { id: createWorkOrderDto.vendorId },
          select: { slaResponseHours: true, slaResolutionHours: true },
        })) || undefined;
    }
    const slaTargets = await this.slaService.calculateTargets(
      priority as any,
      vendorData,
    );

    // --- High-Reliability: Inherit Safety Protocols from Asset ---
    let inheritedSafety = {};
    if (createWorkOrderDto.assetId) {
      const asset = await this.prisma.asset.findUnique({
        where: { id: createWorkOrderDto.assetId },
      });
      if ((asset as any)?.requiresLOTO) {
        inheritedSafety = {
          requiresLOTO: true,
          description:
            `${createWorkOrderDto.description || ''}\n\n[SAFETY NOTICE]\nLOTO Procedure: ${(asset as any).lockoutProcedure || 'Verify energy isolation.'}`.trim(),
        };
      }
    }

    let initialStatus = rest.status || 'OPEN';
    let initialStep = 0;

    // --- Accurate Estimating: Use specific technician rates instead of global flat rate ---
    const globalLaborRate = await this.settingsService.getNumber('labor_rate', 50);
    const approvalThreshold = await this.settingsService.getNumber('approval_threshold', 500);

    let effectiveLaborRate = globalLaborRate;

    // Try to get the rate of the primary assignee or the first technician
    const targetTechId = rest.assignedToId || (technicianIds && technicianIds[0]);
    if (targetTechId) {
      const tech = await this.prisma.userOrganization.findUnique({
        where: { id: targetTechId },
        select: { hourlyRate: true },
      });
      if (tech?.hourlyRate) {
        effectiveLaborRate = Number(tech.hourlyRate);
      }
    }

    const estimatedHours = (rest as any).estimatedHours || 0;
    const estimatedCost = new Prisma.Decimal(estimatedHours).mul(effectiveLaborRate);
      
    if (approvalChainId || estimatedCost.gt(approvalThreshold)) {
      const chain = await this.prisma.approvalChain.findFirst({
        where: {
          organizationId,
          isActive: true,
          OR: [{ id: approvalChainId }, { minCost: { lte: estimatedCost } }],
        },
        include: { steps: true },
      });
      if (chain && chain.steps.length > 0) {
        initialStatus = 'PENDING_APPROVAL';
        initialStep = 1; // 1-indexed for first role
      }
    }

    if (TenancyContext.userOrgId) {
      const creatorOrg = await this.prisma.userOrganization.findUnique({
        where: { id: TenancyContext.userOrgId },
        include: { role: true },
      });
      const restrictedRoles = ['LIMITED_TECHNICIAN', 'LIMITED TECHNICIAN', 'REQUESTER'];
      if (creatorOrg?.role && restrictedRoles.includes(creatorOrg.role.name.toUpperCase())) {
        initialStatus = 'PENDING_APPROVAL';
      }
    }

    // --- Dynamic Workflow: Custom Status Override ---
    if (customStatusId) {
      const custom = await this.prisma.customStatus.findUnique({
        where: { id: customStatusId },
      });
      if (custom) initialStatus = custom.systemStatus;
    }

    // --- Task Handling: Create Checklist on the fly ---
    let finalChecklistId = rest.checklistId;
    if (tasks && tasks.length > 0 && !finalChecklistId) {
      const checklist = await this.prisma.checklist.create({
        data: {
          title: `Checklist for ${rest.title}`,
          organizationId,
          items: {
            create: tasks.map((t) => ({
              task: typeof t === 'string' ? t : t.text,
              isRequired: true,
              dataType: 'PASS_FAIL',
            })),
          },
        },
      });
      finalChecklistId = checklist.id;
    }

    // --- Starting Work Order Number Settings Integration ---
    const startNumberSetting = await this.settingsService.getNumber('wo.startNumber', 1001);
    const maxWorkOrder = await this.prisma.workOrder.findFirst({
      where: { organizationId },
      orderBy: { workOrderNo: 'desc' },
      select: { workOrderNo: true }
    });

    let nextWorkOrderNo: number;
    if (!maxWorkOrder) {
      nextWorkOrderNo = startNumberSetting;
    } else {
      nextWorkOrderNo = Math.max(maxWorkOrder.workOrderNo + 1, startNumberSetting);
    }

    const workOrder = await this.prisma.workOrder.create({
      data: {
        ...rest,
        workOrderNo: nextWorkOrderNo,
        organizationId,
        status: initialStatus as any,
        ...slaTargets,
        ...inheritedSafety,
        customStatusId,
        checklistId: finalChecklistId,
        currentApprovalStep: initialStep,
        technicians: technicianIds
          ? {
              create: technicianIds.map((id) => ({ userId: id })),
            }
          : undefined,
        plannedParts: parts
          ? {
              create: parts.map((p) => ({
                quantity: p.quantity,
                status: 'PLANNED',
                organizationId,
                part: { connect: { id: p.id } },
              })),
            }
          : undefined,
      },
      include: WO_INCLUDES,
    });

    // --- Event-Driven: Emit Creation Event ---
    const createdPayload: WorkOrderCreatedPayload = {
      id: workOrder.id,
      userId,
      organizationId,
      title: workOrder.title,
      workOrderNo: workOrder.workOrderNo,
      assignedToId: workOrder.assignedToId,
    };
    this.eventEmitter.emit(AppEvents.WORKORDER_CREATED, createdPayload);

    // --- EMERGENCY LOGIC: Paging, Halt Production, and LOTO ---
    if (workOrder.maintenanceType === 'EMERGENCY' || createWorkOrderDto.haltProduction) {
      // 1. Halt Production (Recursively set asset and parents to EMERGENCY_STOP)
      if (workOrder.assetId) {
        let currentAssetId: string | null = workOrder.assetId;
        const assetIdsToStop: string[] = [];
        const visited = new Set<string>();

        while (currentAssetId) {
          if (visited.has(currentAssetId)) break;
          visited.add(currentAssetId);
          assetIdsToStop.push(currentAssetId);

          const asset = await this.prisma.asset.findUnique({
            where: { id: currentAssetId },
            select: { parentAssetId: true, parentId: true } as any
          });
          currentAssetId = (asset as any)?.parentAssetId || (asset as any)?.parentId || null;
        }

        if (assetIdsToStop.length > 0) {
          await this.prisma.asset.updateMany({
            where: { id: { in: assetIdsToStop } },
            data: { status: 'EMERGENCY_STOP', downtimeStartedAt: new Date() }
          });

          // Create status history for each
          for (const aId of assetIdsToStop) {
            await this.prisma.assetStatusHistory.create({
              data: {
                assetId: aId,
                toStatus: 'EMERGENCY_STOP',
                changedById: userId || 'SYSTEM',
                reason: `Emergency Halt Production triggered by Work Order #${workOrder.workOrderNo}`,
              }
            });
          }
        }

        // 2. Safety Tag-Out / LOTO
        await this.prisma.workOrderLOTO.create({
          data: {
            workOrderId: workOrder.id,
            organizationId,
            lockedVerified: false,
            tagVerified: false,
            energyVerified: false,
          } as any
        }).catch(() => {}); // ignore if it already exists or schema mismatch
      }

      // 3. Paging (SMS & In-App Notification)
      const techIds = technicianIds ? [...technicianIds] : [];
      if (workOrder.assignedToId && !techIds.includes(workOrder.assignedToId)) {
        techIds.push(workOrder.assignedToId);
      }

      if (techIds.length > 0) {
        // A. In-App Notifications
        for (const tId of techIds) {
          await this.notificationsService.create({
            type: 'EMERGENCY_ALERT' as any,
            title: `🚨 EMERGENCY: ${workOrder.title}`,
            content: `Emergency Work Order #${workOrder.workOrderNo} has been assigned. Immediate action required.`,
            userId: tId,
            organizationId,
            metaData: { workOrderId: workOrder.id, actionUrl: `/work-orders?id=${workOrder.id}` },
          }).catch(err => this.logger.error(`Failed to create in-app emergency notification for ${tId}`, err));
        }

        // B. Twilio SMS
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
          try {
            const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
            
            const techs = await this.prisma.userOrganization.findMany({
              where: { id: { in: techIds } },
              include: { user: { select: { phone: true, name: true } } }
            });

            const fromPhone = process.env.TWILIO_PHONE_NUMBER || '+1234567890';
            const messageBody = `[URGENT CMMS ALERT]\nEmergency Work Order #${workOrder.workOrderNo}: ${workOrder.title}.\nPlease respond immediately!`;

            for (const tech of techs) {
              if (tech.user?.phone) {
                await client.messages.create({
                  body: messageBody,
                  from: fromPhone,
                  to: tech.user.phone
                }).then(msg => this.logger.log(`SMS Sent to ${tech.user.name}: ${msg.sid}`))
                  .catch(err => this.logger.error(`Failed to send SMS to ${tech.user.name}:`, err));
              }
            }
          } catch (error) {
            this.logger.error('Failed to initialize Twilio client or send SMS', error);
          }
        } else {
          this.logger.warn('Emergency Work Order created, but Twilio credentials are missing in .env. SMS Paging skipped.');
        }
      }
    }

    if (workOrder.assignedToId) {
      this.notificationsService.notifyAssignment(workOrder);
    }

    // --- Multi-Level Approval: Notify Managers ---
    if (initialStatus === 'PENDING_APPROVAL') {
      const managers = await this.prisma.userOrganization.findMany({
        where: {
          organizationId,
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
        include: { user: { select: { email: true } } },
      });

      for (const mgr of managers) {
        await this.notificationsService.create({
          type: 'APPROVAL_REQUEST',
          title: `APPROVAL REQUIRED: ${workOrder.title}`,
          content: `A new work order #${workOrder.workOrderNo} requires manager review before execution.`,
          userId: mgr.id,
          organizationId,
          metaData: { workOrderId: workOrder.id, actionUrl: `/work-orders?id=${workOrder.id}` },
        });

        if (mgr.user?.email) {
          await this.mailService
            .sendWorkOrderNotification(
              mgr.user.email,
              'Approval Required',
              `Work order #${workOrder.workOrderNo} is waiting for your review.`,
              `/work-orders/${workOrder.id}`,
            )
            .catch(() => {});
        }
      }
    }

    return workOrder as any;
  }

  async addLink(sourceId: string, dto: AddLinkDto) {
    const organizationId = TenancyContext.organizationId || '';
    return this.prisma.workOrderLink.create({
      data: {
        sourceId,
        targetId: dto.targetId,
        linkType: dto.type || 'RELATED',
        organizationId,
      },
      include: {
        targetWorkOrder: { select: { id: true, title: true, workOrderNo: true, status: true } }
      }
    });
  }

  async removeLink(linkId: string) {
    return this.prisma.workOrderLink.delete({
      where: { id: linkId },
    });
  }

  async findAll(query?: WorkOrderQueryDto) {
    const organizationId = TenancyContext.organizationId || '';
    const userOrgId = TenancyContext.userOrgId;

    // --- High-Performance Server-Side Filtering & Pagination ---
    const {
      page,
      limit,
      search,
      status,
      priority,
      maintenanceType,
      assetId,
      locationId,
      assignedToId,
      assignedTeamId,
      isShared,
      isBookmarked,
      isRepeating,
      pmScheduleId,
      sortBy,
      sortOrder,
      dueDateStart,
      dueDateEnd,
      isScheduled,
      startDateStart,
      startDateEnd,
      category,
      createdAtStart,
      } = query || {};

    this.logger.debug(`[DEBUG] findAll query parameters: ${JSON.stringify(query)}`);

    const where: Prisma.WorkOrderWhereInput = {};

    // --- PERMISSION-BASED DATA ISOLATION (RLS) ---
    // If the user lacks 'READ_ALL' permission, strictly limit them to their own assignments.
    // This allows for granular security without hard-coded role names (ADMIN/TECHNICIAN).
    const hasReadAll = TenancyContext.hasPermission(Permissions.WORK_ORDERS.READ_ALL);

    if (!hasReadAll) {
      const isolation = {
        OR: [
          { assignedToId: userOrgId },
          { technicians: { some: { userId: userOrgId } } },
          // Also allow them to see work orders assigned to their teams
          { assignedTeam: { users: { some: { userOrgId } } } },
        ],
      };
      
      if (!where.AND) where.AND = [];
      (where.AND as any[]).push(isolation);

      this.logger.debug(`Applying data isolation for user: ${userOrgId}`);
    }

    if (status) {
      where.status = (status.includes(',') ? { in: status.split(',') } : status) as any;
    }
    if (priority) {
      where.priority = (priority.includes(',')
        ? { in: priority.split(',') }
        : priority) as any;
    }
    if (maintenanceType) where.maintenanceType = maintenanceType as any;
    if (assetId) {
      where.assetId = assetId.includes(',')
        ? { in: assetId.split(',') }
        : assetId;
    }
    if (locationId) {
      where.locationId = locationId.includes(',')
        ? { in: locationId.split(',') }
        : locationId;
    }
    if (assignedToId) {
      const ids = assignedToId.split(',');
      const hasUnassigned = ids.includes('unassigned');
      const realIds = ids.filter((id) => id !== 'unassigned');

      const filterOR: any[] = [];
      
      if (realIds.length > 0) {
        filterOR.push({ assignedToId: { in: realIds } });
        filterOR.push({ technicians: { some: { userId: { in: realIds } } } });
      }
      
      if (hasUnassigned) {
        filterOR.push({ assignedToId: null });
      }

      if (filterOR.length > 0) {
        if (!where.AND) where.AND = [];
        (where.AND as any[]).push({ OR: filterOR });
      }
    }
    if (assignedTeamId) where.assignedTeamId = assignedTeamId;
    if (isShared !== undefined) where.isShared = isShared === 'true';
    if (isBookmarked !== undefined)
      where.isBookmarked = isBookmarked === 'true';
    if (isRepeating !== undefined) where.isRepeating = isRepeating === 'true';
    if (pmScheduleId) where.pmScheduleId = pmScheduleId;

    if (dueDateStart || dueDateEnd) {
      const condition: Prisma.DateTimeNullableFilter = {};
      if (dueDateStart) condition.gte = new Date(dueDateStart);
      if (dueDateEnd) condition.lte = new Date(dueDateEnd);
      where.dueDate = condition;
    }

    // --- Scheduler: Scheduled vs Unscheduled split ---
    if (isScheduled === 'true') {
      // WOs that are fully scheduled: have a startDate AND an assigned user
      if (!where.AND) where.AND = [];
      (where.AND as any[]).push({ startDate: { not: null } });
      (where.AND as any[]).push({ assignedToId: { not: null } });
    } else if (isScheduled === 'false') {
      // WOs that are unscheduled: missing startDate OR missing assignee
      if (!where.AND) where.AND = [];
      (where.AND as any[]).push({
        OR: [
          { startDate: null },
          { assignedToId: null },
        ],
      });
    }

    // --- Scheduler Timeline: filter by startDate range ---
    if (startDateStart || startDateEnd) {
      const condition: Prisma.DateTimeNullableFilter = {};
      if (startDateStart) condition.gte = new Date(startDateStart);
      if (startDateEnd) condition.lte = new Date(startDateEnd);
      if (!where.AND) where.AND = [];
      (where.AND as any[]).push({ startDate: condition });
    }

    // --- Category filter ---
    if (category) {
      where.category = { contains: category, mode: 'insensitive' } as any;
    }

    // --- CreatedAt offline sync limit ---
    if (createdAtStart) {
      if (!where.createdAt) where.createdAt = {};
      (where.createdAt as any).gte = new Date(createdAtStart);
    }

    if (search) {
      const cleanSearch = search.trim();
      // Strip common prefixes like '#' or 'WO-' if followed by number
      const matchNumber = cleanSearch.replace(/^(WO|wo|#|-)+/, '');

      where.OR = [
        { title: { contains: cleanSearch, mode: 'insensitive' } },
        { description: { contains: cleanSearch, mode: 'insensitive' } },
        { category: { contains: cleanSearch, mode: 'insensitive' } },
        {
          asset: {
            name: { contains: cleanSearch, mode: 'insensitive' },
          },
        },
        {
          location: {
            name: { contains: cleanSearch, mode: 'insensitive' },
          },
        },
        {
          assignedTo: {
            user: {
              name: { contains: cleanSearch, mode: 'insensitive' },
            },
          },
        },
      ];

      if (matchNumber && !isNaN(Number(matchNumber))) {
        where.OR.push({ workOrderNo: Number(matchNumber) });
      }
    }

    // --- Dynamic Sorting ---
    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    // --- Backward Compatibility Guard ---
    // If neither page nor limit nor any major filter is provided, return plain array for offline sync hydration.
    if (
      !page &&
      !limit &&
      !search &&
      !status &&
      !priority &&
      !assetId &&
      !locationId &&
      !assignedToId &&
      !isShared &&
      !isBookmarked &&
      !isRepeating &&
      !isScheduled &&
      !startDateStart &&
      !startDateEnd &&
      !category &&
      !createdAtStart
    ) {
      return this.prisma.workOrder.findMany({
        where,
        include: WO_INCLUDES,
        orderBy,
      });
    }

    const currentPage = Number(page) || 1;
    const currentLimit = Number(limit) || 20;
    const skip = (currentPage - 1) * currentLimit;

    const countWhere = { ...where };
    delete countWhere.status;

    const [items, total, statusCountsRaw] = await Promise.all([
      this.prisma.workOrder.findMany({
        where,
        include: WO_INCLUDES,
        orderBy,
        skip,
        take: currentLimit,
      }),
      this.prisma.workOrder.count({ where }),
      this.prisma.workOrder.groupBy({
        where: countWhere,
        by: ['status'],
        _count: true,
      }),
    ]);

    const statusCounts = statusCountsRaw.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {} as Record<string, number>);

    return {
      items,
      meta: {
        total,
        page: currentPage,
        limit: currentLimit,
        totalPages: Math.ceil(total / currentLimit),
        statusCounts,
      },
    };
  }

  async findOne(id: string): Promise<WorkOrderDetailed> {
    const organizationId = TenancyContext.organizationId || '';
    const userOrgId = TenancyContext.userOrgId;

    // organizationId is the primary tenant boundary — always enforced
    const where: Prisma.WorkOrderWhereInput = { id, organizationId };

    // Secondary RBAC: further restrict to work orders the user is involved in
    const hasReadAll = TenancyContext.hasPermission(Permissions.WORK_ORDERS.READ_ALL);

    if (!hasReadAll) {
      where.OR = [
        { assignedToId: userOrgId },
        { technicians: { some: { userId: userOrgId } } },
        { assignedTeam: { users: { some: { userOrgId } } } },
      ];
    }

    const workOrder = await this.prisma.workOrder.findFirst({
      where,
      include: WO_DETAILED_INCLUDES,
    });
    if (!workOrder) {
      throw new NotFoundException(`Work Order with ID ${id} not found`);
    }

    // Load status history without relation if no named relation exists on UserOrganization
    const statusHistory = await (
      this.prisma as any
    ).workOrderStatusHistory.findMany({
      where: { workOrderId: id },
      orderBy: { createdAt: 'desc' },
    });
    (workOrder as any).statusHistory = statusHistory;

    return workOrder;
  }

  async reviewWorkOrder(id: string, status: 'CLOSED' | 'IN_PROGRESS', notes: string) {
    const userOrgId = TenancyContext.userOrgId;
    if (!userOrgId) throw new ForbiddenException('No user context');
    const organizationId = TenancyContext.organizationId;
    
    const userOrg = await this.prisma.userOrganization.findUnique({
      where: { id: userOrgId },
      include: { role: true },
    });
    const validRoles = ['ADMINISTRATOR', 'OWNER', 'MANAGER', 'ADMIN', 'LIMITED ADMINISTRATOR', 'MAINTENANCE MANAGER'];
    if (!userOrg || !userOrg.role || !validRoles.includes(userOrg.role.name.toUpperCase())) {
      throw new ForbiddenException('Only managers and administrators can review completed work orders.');
    }

    const existing = await this.findOne(id);
    if (existing.status !== 'COMPLETED') {
      throw new BadRequestException('Only completed work orders can be reviewed.');
    }

    if (status === 'CLOSED') {
      const updated = await this.prisma.workOrder.update({
        where: { id },
        data: {
          status: 'CLOSED',
          closedById: userOrgId,
          closedAt: new Date(),
          closeoutNotes: notes || null,
        },
      });

      await this.prisma.workOrderStatusHistory.create({
        data: {
          workOrderId: id,
          fromStatus: 'COMPLETED',
          toStatus: 'CLOSED',
          changedById: userOrgId,
          reason: 'Manager Review Approved',
        },
      });

      const statusPayload: WorkOrderStatusUpdatedPayload = {
        id,
        fromStatus: 'COMPLETED',
        toStatus: 'CLOSED',
        userId: userOrgId,
        organizationId: organizationId || '',
      };
      this.eventEmitter.emit(AppEvents.WORKORDER_STATUS_UPDATED, statusPayload);

      return updated;
    } else if (status === 'IN_PROGRESS') {
      const updated = await this.prisma.workOrder.update({
        where: { id },
        data: {
          status: 'IN_PROGRESS',
        },
      });

      if (notes) {
        await this.prisma.workOrderComment.create({
          data: {
            workOrderId: id,
            text: `**[Manager Review Rejection]**\n${notes}`,
            userId: userOrgId,
          }
        });
      }

      await this.prisma.workOrderStatusHistory.create({
        data: {
          workOrderId: id,
          fromStatus: 'COMPLETED',
          toStatus: 'IN_PROGRESS',
          changedById: userOrgId,
          reason: 'Manager Review Rejected',
        },
      });

      const statusPayload: WorkOrderStatusUpdatedPayload = {
        id,
        fromStatus: 'COMPLETED',
        toStatus: 'IN_PROGRESS',
        userId: userOrgId,
        organizationId: organizationId || '',
      };
      this.eventEmitter.emit(AppEvents.WORKORDER_STATUS_UPDATED, statusPayload);

      if (existing.assignedToId) {
        this.gateway.notifyWorkOrderAssignment(existing.assignedToId, {
          id,
          status: 'IN_PROGRESS',
          title: `[REJECTED] ${existing.title}`,
        });
      }

      return updated;
    } else {
      throw new BadRequestException('Invalid review status');
    }
  }

  async update(
    id: string,
    updateWorkOrderDto: UpdateWorkOrderDto,
  ): Promise<WorkOrder> {
    const existing = await this.findOne(id);
    const userOrgId = TenancyContext.userOrgId;
    
    // --- Regulatory Compliance: Signature Locking (FDA 21 CFR Part 11) ---
    const isSigned = !!existing.signatureUrl || !!existing.signedById;
    const from = existing.status;
    let to = (updateWorkOrderDto as any).status || from;

    if (isSigned) {
      // Check if we are doing a formal reopening/unlocking
      const isReopening = from === 'COMPLETED' && (to === 'OPEN' || to === 'IN_PROGRESS') && !!updateWorkOrderDto.reopenReason;
      
      // If not reopening, block all edits
      if (!isReopening) {
        throw new BadRequestException(
          'FDA 21 CFR Part 11 Compliance: This work order is digitally signed and locked. You must formally reopen or unlock it with an audit reason to make edits.',
        );
      }
    }

    // Check if user has permission to manage financial data
    const canManageCosts = TenancyContext.hasPermission(Permissions.WORK_ORDERS.MANAGE_COSTS);

    // --- Field-Level Permissions: Cost Restrictions ---
    if (
      !canManageCosts &&
      (updateWorkOrderDto.laborCost !== undefined ||
        updateWorkOrderDto.partsCost !== undefined ||
        updateWorkOrderDto.estimatedCost !== undefined)
    ) {
      throw new ForbiddenException(
        'PBAC Rule: Only Managers can manually override Work Order costs.',
      );
    }

    const { tasks, parts, technicianIds, ...restDto } = updateWorkOrderDto;
    const data: any = { ...restDto };
    const organizationId = TenancyContext.organizationId || '';

    // --- Flowchart: Guard Decision Tree & Status Transitions ---

    // --- Formal Reopen Flow: Logic & Auditing ---
    if (from === 'COMPLETED' && (to === 'OPEN' || to === 'IN_PROGRESS')) {
      if (!updateWorkOrderDto.reopenReason) {
        throw new BadRequestException(
          'Compliance: Formal Reopening requires an Audit Reason (reopenReason).',
        );
      }
      data.completedAt = null;
      data.signedById = null;
      data.signatureUrl = null;

      // Record in AuditLog for compliance
      await this.prisma.auditLog.create({
        data: {
          action: 'REOPEN',
          model: 'WorkOrder',
          entityId: id,
          userId: TenancyContext.userId || null,
          organizationId,
          oldData: { status: from, signatureUrl: existing.signatureUrl, signedById: existing.signedById },
          newData: { status: to, reason: updateWorkOrderDto.reopenReason },
        },
      });

      // Re-calculate SLA to give 24h grace or reset targets
      let vendorData: any = undefined;
      if (existing.vendorId) {
        vendorData =
          (await this.prisma.vendor.findUnique({
            where: { id: existing.vendorId },
            select: { slaResponseHours: true, slaResolutionHours: true },
          })) || undefined;
      }
      const newTargets = await this.slaService.calculateTargets(
        existing.priority,
        vendorData,
      );
      Object.assign(data, newTargets);
      this.logger.log(`Formal Reopen of Work Order #${id} by ${userOrgId}`);
    }

    // --- Dynamic Workflow: Custom Status Mapping ---
    if (
      updateWorkOrderDto.customStatusId &&
      updateWorkOrderDto.customStatusId !== existing.customStatusId
    ) {
      const custom = await this.prisma.customStatus.findUnique({
        where: { id: updateWorkOrderDto.customStatusId },
      });
      if (custom) {
        to = custom.systemStatus;
        data.status = to;
      }
    }

    // --- Dependency Guard: Block Start/Complete until Predecessor is Finished ---
    if ((to === 'IN_PROGRESS' || to === 'COMPLETED') && from !== to) {
      if (existing.predecessorId) {
        const pred = await this.prisma.workOrder.findUnique({
          where: { id: existing.predecessorId },
          select: { status: true, workOrderNo: true },
        });
        if (pred && pred.status !== 'COMPLETED' && pred.status !== 'CLOSED') {
          throw new BadRequestException(
            `Dependency Rule: Predecessor #${pred.workOrderNo} must be COMPLETED before starting this task.`,
          );
        }
      }
    }

    // --- Status Transition Rules: Guards ---
    if (to !== from) {
      // PERMIT TO WORK GUARD
      if (to === 'IN_PROGRESS') {
        const pendingPermits = await this.prisma.permit.count({
          where: {
            workOrderId: id,
            status: { not: 'APPROVED' },
            deletedAt: null,
          }
        });
        if (pendingPermits > 0) {
          throw new BadRequestException(
            'Safety Compliance: Cannot start Work Order. There are pending Permits that require approval.'
          );
        }
      }

      // A. SAFETY GUARD: LOTO (Lock-Out Tag-Out) Verification
      const requireLoto = await this.settingsService.getString('wo.requireLoto', 'false');
      if (
        requireLoto === 'true' &&
        to === 'IN_PROGRESS' &&
        existing.requiresLOTO &&
        !existing.lotoVerified
      ) {
        throw new BadRequestException(
          'Safety Compliance (ISO 45001): Work cannot start until LOTO verification is complete.',
        );
      }

      // 1. Guard: OPEN -> IN_PROGRESS (Start Timer)
      if (from === 'OPEN' && to === 'IN_PROGRESS') {
        data.startDate = existing.startDate || new Date();
        // Respect the 'autoUpdateTimer' setting from Work Order General Settings
        const autoTimer = await this.settingsService.getString('wo.autoUpdateTimer', 'true');
        if (autoTimer === 'true') {
          await this.startWorkTimer(id, userOrgId);
        }
      }

      // 2. Guard: IN_PROGRESS -> ON_HOLD (Pause Timer)
      if (from === 'IN_PROGRESS' && to === 'ON_HOLD') {
        if (!updateWorkOrderDto.onHoldReason) {
          throw new BadRequestException(
            'Flowchart Rule: Pause Timer requires a Reason (onHoldReason).',
          );
        }
        // Respect the 'autoUpdateTimer' setting
        const autoTimer = await this.settingsService.getString('wo.autoUpdateTimer', 'true');
        if (autoTimer === 'true') {
          await this.pauseWorkTimer(id, userOrgId);
        }
      }

      // 3. Guard: ON_HOLD -> IN_PROGRESS (Resume Timer)
      if (from === 'ON_HOLD' && to === 'IN_PROGRESS') {
        const autoTimer = await this.settingsService.getString('wo.autoUpdateTimer', 'true');
        if (autoTimer === 'true') {
          await this.startWorkTimer(id, userOrgId);
        }
      }

      // 4. Guard: IN_PROGRESS -> COMPLETED (Auto Validation & RCA)
      if (to === 'COMPLETED' && from !== 'COMPLETED') {
        if (from !== 'IN_PROGRESS' && from !== 'ON_HOLD') {
          throw new BadRequestException(
            'Status Guard: Must be In Progress or On Hold to Mark Complete.',
          );
        }
      }

      if (to === 'COMPLETED') {
        if (!(updateWorkOrderDto.resolutionNotes || existing.resolutionNotes)) {
          throw new BadRequestException(
            'Resolution notes are required to complete.',
          );
        }

        // Flowchart Decision: Capture Failure / RCA (Enforce for Reactive work)
        if (
          existing.maintenanceType === 'REACTIVE' &&
          !(updateWorkOrderDto.rootCauseCode || existing.rootCauseCode)
        ) {
          throw new BadRequestException(
            'RCA Enforced: Root Cause Code is required for Reactive breakdowns.',
          );
        }

        if (existing.checklistId && from !== 'COMPLETED') {
          const checklist = await this.prisma.checklist.findUnique({
            where: { id: existing.checklistId },
            include: { items: true },
          });
          if (!checklist) throw new NotFoundException('Checklist not found');
          const responses = await this.prisma.workOrderChecklistResponse.findMany({
            where: { workOrderId: id },
          });
          const missingRequired = checklist.items.filter((item: any) => {
            if (!item.isRequired) return false;
            const response = responses.find(
              (r: any) => r.checklistItemId === item.id,
            );
            return (
              !response ||
              response.responseValue === null ||
              response.responseValue === ''
            );
          });
          if (missingRequired.length > 0) {
            throw new BadRequestException(
              `Checklist Guard: ${missingRequired.length} mandatory items incomplete.`,
            );
          }
        }

        // Close ALL active timers across all users to prevent orphaned ghost timers when completing
        await this.lifecycleService.pauseAllActiveTimers(id);
        data.completedAt = new Date();

        // --- Asset Intelligence: Sync Downtime to Asset ---
        if (
          existing.assetId &&
          existing.isDowntimeEvent &&
          (updateWorkOrderDto.downtimeMinutes || existing.downtimeMinutes)
        ) {
          await this.prisma.asset.update({
            where: { id: existing.assetId },
            data: {
              totalDowntimeMinutes: {
                increment:
                  (updateWorkOrderDto.downtimeMinutes ||
                  existing.downtimeMinutes) || 0,
              },
            },
          });
        }
      }

      // 5. Guard: COMPLETED -> CLOSED (Supervisor Review)
      if (to === 'CLOSED') {
        const requireAdminClose = await this.settingsService.getString('wo.requireAdminClose', 'false');
        if (requireAdminClose === 'true' && from !== 'COMPLETED') {
          throw new BadRequestException(
            'Supervisor Guard: Final Closure must follow Completion Review.',
          );
        }
        // Check if user has supervisor role? We rely on PermissionsGuard for that.
      }

      // Write Status Audit Log (Flowchart: Audit Log - Notify)
      await this.prisma.workOrderStatusHistory.create({
        data: {
          workOrderId: id,
          fromStatus: from,
          toStatus: to,
          changedById: userOrgId,
          reason: updateWorkOrderDto.statusChangeReason || null,
        },
      });

      // --- Event-Driven: Emit Status Change Event ---
      const statusPayload: WorkOrderStatusUpdatedPayload = {
        id,
        fromStatus: from,
        toStatus: to,
        userId: userOrgId,
        organizationId: TenancyContext.organizationId || '',
      };
      this.eventEmitter.emit(AppEvents.WORKORDER_STATUS_UPDATED, statusPayload);

      if (to === 'COMPLETED' && from !== 'COMPLETED') {
        const completedPayload: WorkOrderCompletedPayload = {
          id,
          userId: userOrgId,
          organizationId: TenancyContext.organizationId || '',
          completedAt: new Date(),
        };
        this.eventEmitter.emit(AppEvents.WORKORDER_COMPLETED, completedPayload);
      }

      // Logic: Notify Assignee on status change?
      this.gateway.notifyWorkOrderAssignment(existing.assignedToId || 'ALL', {
        id,
        status: to,
        title: existing.title,
      });
    }
    delete data.statusChangeReason; // clean up before save

    // --- Accurate Estimating: Dynamic Recalculation on Reassignment ---
    if (
      (updateWorkOrderDto.assignedToId !== undefined && updateWorkOrderDto.assignedToId !== existing.assignedToId) ||
      (updateWorkOrderDto.estimatedHours !== undefined && updateWorkOrderDto.estimatedHours !== Number(existing.estimatedHours))
    ) {
      const globalLaborRate = await this.settingsService.getNumber('labor_rate', 50);
      let effectiveLaborRate = globalLaborRate;

      const targetTechId = updateWorkOrderDto.assignedToId || existing.assignedToId;
      if (targetTechId) {
        const tech = await this.prisma.userOrganization.findUnique({
          where: { id: targetTechId },
          select: { hourlyRate: true },
        });
        if (tech?.hourlyRate) {
          effectiveLaborRate = Number(tech.hourlyRate);
        }
      }

      const estimatedHours = updateWorkOrderDto.estimatedHours !== undefined 
        ? updateWorkOrderDto.estimatedHours 
        : Number(existing.estimatedHours || 0);

      // Only auto-recalculate if the user didn't explicitly provide a new estimatedCost in the DTO
      if (updateWorkOrderDto.estimatedCost === undefined) {
        data.estimatedCost = new Prisma.Decimal(estimatedHours).mul(effectiveLaborRate);
      }
    }

    // Dynamic Total Cost Recalculation (if additionalCost changes)
    // Labor and Parts cost are rolled up automatically by their respective log endpoints
    if (
      updateWorkOrderDto.laborCost !== undefined ||
      updateWorkOrderDto.partsCost !== undefined ||
      updateWorkOrderDto.additionalCost !== undefined
    ) {
      const labor = new Prisma.Decimal(updateWorkOrderDto.laborCost !== undefined ? updateWorkOrderDto.laborCost : existing.laborCost || 0);
      const parts = new Prisma.Decimal(updateWorkOrderDto.partsCost !== undefined ? updateWorkOrderDto.partsCost : existing.partsCost || 0);
      const added = new Prisma.Decimal(updateWorkOrderDto.additionalCost !== undefined ? updateWorkOrderDto.additionalCost : existing.additionalCost || 0);
      data.totalCost = labor.plus(parts).plus(added);
    }

    try {
      if (updateWorkOrderDto.technicianIds) {
        const technicianIds = updateWorkOrderDto.technicianIds;
        const currentTechs = await (
          this.prisma as any
        ).workOrderTechnician.findMany({
          where: { workOrderId: id },
        });
        const currentIds = currentTechs.map((t: any) => t.userId);
        const toRemove = currentIds.filter(
          (cid: string) => !technicianIds.includes(cid),
        );
        const toAdd = technicianIds.filter(
          (nid: string) => !currentIds.includes(nid),
        );

        if (toRemove.length > 0) {
          await this.prisma.workOrderTechnician.deleteMany({
            where: { workOrderId: id, userId: { in: toRemove } },
          });
        }
        if (toAdd.length > 0) {
          await this.prisma.workOrderTechnician.createMany({
            data: toAdd.map((tid) => ({ workOrderId: id, userId: tid })),
          });
          
          // Notify new collaborating technicians
          for (const tid of toAdd) {
            this.notificationsService.notifyAssignment({
              ...existing,
              assignedToId: tid,
              title: `[Collaboration] ${existing.title}`,
            }).catch(() => {});
          }
        }
      }

      // --- Task Handling: Sync Checklist Items ---
      if (tasks && Array.isArray(tasks)) {
        if (existing.checklistId) {
          // Update existing checklist items
          await this.prisma.checklistItem.deleteMany({
            where: { checklistId: existing.checklistId },
          });
          if (tasks.length > 0) {
            await this.prisma.checklistItem.createMany({
              data: tasks.map((t, idx) => {
                const type = t.type?.toUpperCase() || 'TEXT';
                return {
                  checklistId: existing.checklistId as string,
                  task: t.text || (typeof t === 'string' ? t : 'Task Item'),
                  isRequired: t.isRequired || false,
                  dataType: type === 'INSPECTION' ? 'PASS_FAIL' : type === 'NUMBER' ? 'NUMBER' : 'TEXT_INPUT',
                  order: idx,
                  organizationId,
                };
              }),
            });
          }
        } else if (tasks.length > 0) {
          // Create new checklist
          const newChecklist = await this.prisma.checklist.create({
            data: {
              title: `Checklist for ${data.title || existing.title}`,
              organizationId,
              items: {
                create: tasks.map((t, idx) => {
                  const type = t.type?.toUpperCase() || 'TEXT_INPUT';
                  return {
                    task: t.text || (typeof t === 'string' ? t : 'Task Item'),
                    isRequired: t.isRequired || false,
                    dataType: type === 'INSPECTION' ? 'PASS_FAIL' : type === 'NUMBER' ? 'NUMBER' : 'TEXT_INPUT',
                    order: idx,
                    organizationId,
                  };
                }),
              },
            },
          });
          data.checklistId = newChecklist.id;
        }
      }

      // --- Planned Parts Handling: Sync planned parts ---
      if (parts && Array.isArray(parts)) {
        await this.prisma.workOrderPlannedPart.deleteMany({
          where: { workOrderId: id },
        });
        if (parts.length > 0) {
          // Deduplicate parts by partId to avoid unique constraint violations
          const uniqueParts = Array.from(new Map(parts.map(p => [p.partId, p])).values());
          
          await this.prisma.workOrderPlannedPart.createMany({
            data: uniqueParts.map(p => ({
              workOrderId: id,
              partId: p.partId,
              quantity: p.quantity || 1,
              organizationId,
            })),
          });
        }
      }

      // Increment version for compliance tracking and optimistic locking
      const expectedVersion = existing.version || 1;
      data.version = expectedVersion + 1;
      
      // Record update in AuditLog for compliance
      await this.prisma.auditLog.create({
        data: {
          action: 'UPDATE',
          model: 'WorkOrder',
          entityId: id,
          userId: TenancyContext.userId || null,
          organizationId,
          oldData: { version: existing.version, status: existing.status, title: existing.title, description: existing.description },
          newData: { version: data.version, status: to, title: data.title || existing.title, description: data.description || existing.description },
        },
      });

      // Optimistic concurrency check: update where id and version match expected version
      const updatedCount = await this.prisma.workOrder.updateMany({
        where: { id, version: expectedVersion, organizationId },
        data,
      });

      if (updatedCount.count === 0) {
        throw new ConflictException(
          'Work Order was updated by another user or session. Please refresh and try again.',
        );
      }

      return await this.prisma.workOrder.findUnique({
        where: { id },
        include: WO_INCLUDES,
      }) as any;
    } catch (error: any) {
      console.error('Work Order Update Failure:', error);
      throw new BadRequestException(`Update Failed: ${error.message}`);
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    const organizationId = TenancyContext.organizationId || '';
    // findOne verifies both org boundary and user RBAC before we delete
    await this.findOne(id);
    await this.prisma.workOrder.delete({
      where: { id, organizationId },
    });

    return { message: 'Work Order deleted successfully' };
  }

  // ── ENTERPRISE MODULES ──────────────────────────────────────────────────

  async startTimerExternal(id: string) {
    const userOrgId = TenancyContext.userOrgId;
    const organizationId = TenancyContext.organizationId;
    if (!userOrgId) {
      throw new BadRequestException('No User Organization context found.');
    }
    
    // Also update the work order status to IN_PROGRESS if it's currently OPEN
    const wo = await this.prisma.workOrder.findFirst({ where: { id, organizationId } });
    if (!wo) {
      throw new NotFoundException(`Work Order with ID ${id} not found`);
    }

    if (wo.status === 'OPEN') {
      await this.prisma.workOrder.update({
        where: { id },
        data: { status: 'IN_PROGRESS', startDate: wo.startDate || new Date() },
      });
      // Add status history entry
      await this.prisma.workOrderStatusHistory.create({
        data: {
          workOrderId: id,
          fromStatus: 'OPEN',
          toStatus: 'IN_PROGRESS',
          changedById: userOrgId,
          reason: 'Timer Started',
        },
      });

      // Emit status change event
      const statusPayload = {
        id,
        fromStatus: 'OPEN',
        toStatus: 'IN_PROGRESS',
        userId: userOrgId,
        organizationId: TenancyContext.organizationId || '',
      };
      this.eventEmitter.emit(AppEvents.WORKORDER_STATUS_UPDATED, statusPayload);

      // Notify assignment gateway
      this.gateway.notifyWorkOrderAssignment(wo.assignedToId || 'ALL', {
        id,
        status: 'IN_PROGRESS',
        title: wo.title,
      });
    }

    await this.startWorkTimer(id, userOrgId);
    return { success: true };
  }

  async pauseTimerExternal(id: string) {
    const userOrgId = TenancyContext.userOrgId;
    if (!userOrgId) {
      throw new BadRequestException('No User Organization context found.');
    }
    // Use pauseAllActiveTimers to stop any running timer on this work order,
    // regardless of which user started it (timers can be started via status transitions)
    await this.lifecycleService.pauseAllActiveTimers(id);
    return { success: true };
  }


  async addTimeLog(workOrderId: string, dto: AddTimeLogDto) {
    const workOrder = await this.findOne(workOrderId);
    return this.financeService.addTimeLog(
      workOrderId,
      dto,
      workOrder.laborCost || 0,
      workOrder.actualHours || 0,
      workOrder.partsCost || 0,
      workOrder.additionalCost || 0,
    );
  }

  async addExpense(workOrderId: string, dto: AddExpenseDto) {
    const workOrder = await this.findOne(workOrderId);
    return this.financeService.addExpense(
      workOrderId,
      dto,
      workOrder.laborCost || 0,
      workOrder.partsCost || 0,
    );
  }

  async addComment(workOrderId: string, dto: AddWorkOrderCommentDto) {
    await this.findOne(workOrderId);
    return this.collaborationService.addComment(workOrderId, dto);
  }

  async addFile(workOrderId: string, file: Express.Multer.File) {
    await this.findOne(workOrderId);
    return this.collaborationService.addFile(workOrderId, file);
  }

  async consumePart(workOrderId: string, dto: AddWorkOrderPartDto) {
    return this.financeService.consumePart(workOrderId, dto);
  }

  async consumeParts(workOrderId: string, dto: AddWorkOrderPartsDto) {
    for (const part of dto.parts) {
      await this.consumePart(workOrderId, part);
    }
    return { success: true, count: dto.parts.length };
  }

  async getStatusHistory(workOrderId: string) {
    await this.findOne(workOrderId);
    return this.prisma.workOrderStatusHistory.findMany({
      where: { workOrderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addChecklistResponse(
    workOrderId: string,
    dto: AddChecklistResponseDto,
  ) {
    const workOrder = await this.findOne(workOrderId);
    const userOrgId = TenancyContext.userOrgId;

    return this.prisma.$transaction(async (tx: any) => {
      // 1. Get the checklist item to check for triggers
      const item = await tx.checklistItem.findUnique({
        where: { id: dto.checklistItemId },
      });

      let passed = dto.passed;

      // Smart Range Parsing for NUMBER data types (Enterprise Anomaly Detection)
      if (item && item.dataType === 'NUMBER' && dto.responseValue) {
        const numericVal = parseFloat(dto.responseValue);
        if (!isNaN(numericVal)) {
          let minLimit: number | null = null;
          let maxLimit: number | null = null;
          
          for (const opt of item.options || []) {
            if (opt.startsWith('min:')) {
              minLimit = parseFloat(opt.split(':')[1]);
            } else if (opt.startsWith('max:')) {
              maxLimit = parseFloat(opt.split(':')[1]);
            }
          }

          if (minLimit !== null && numericVal < minLimit) {
            passed = false;
          }
          if (maxLimit !== null && numericVal > maxLimit) {
            passed = false;
          }
        }
      }

      // 2. Save the response
      const response = await tx.workOrderChecklistResponse.upsert({
        where: {
          workOrderId_checklistItemId: {
            workOrderId,
            checklistItemId: dto.checklistItemId,
          },
        },
        update: {
          responseValue: dto.responseValue,
          passed: passed,
          userId: userOrgId,
          notes: dto.notes,
          photoUrl: dto.photoUrl,
          url: dto.url,
        },
        create: {
          workOrderId,
          checklistItemId: dto.checklistItemId,
          responseValue: dto.responseValue,
          passed: passed,
          userId: userOrgId,
          notes: dto.notes,
          photoUrl: dto.photoUrl,
          url: dto.url,
        },
      });

      // 3. SMART TRIGGER: If item failed and it has a trigger, spawn corrective work order
      if (passed === false && item?.failTriggerWO) {
        await tx.workOrder.create({
          data: {
            title: `[FOLLOW-UP] Failed Task: ${item.task}`,
            description: `Automatically created due to failed checklist item on Work Order #${workOrderId}.\nOriginal Task: ${item.task}`,
            status: 'OPEN',
            priority: 'HIGH',
            maintenanceType: 'CORRECTIVE',
            assetId: workOrder.assetId,
            parentWorkOrderId: workOrderId,
            organizationId: workOrder.organizationId,
          },
        });
      }

      return response;
    });
  }

  // --- Private Flowchart Helpers ---

  private async startWorkTimer(workOrderId: string, userId: string) {
    return this.lifecycleService.startWorkTimer(workOrderId, userId);
  }

  // --- Inventory Planning & BOM ---

  async applyAssetBOM(workOrderId: string) {
    const workOrder = await this.findOne(workOrderId);
    if (!workOrder.assetId) return;

    const assetParts = await this.prisma.assetPart.findMany({
      where: { assetId: workOrder.assetId },
    });

    const organizationId = TenancyContext.organizationId || '';

    for (const ap of assetParts) {
      await this.prisma.workOrderPlannedPart.upsert({
        where: { workOrderId_partId: { workOrderId, partId: ap.partId } },
        update: { quantity: ap.quantityNeeded },
        create: {
          workOrderId,
          partId: ap.partId,
          quantity: ap.quantityNeeded,
          status: 'PLANNED',
          organizationId,
        },
      });
    }
    return { count: assetParts.length };
  }

  private async pauseWorkTimer(workOrderId: string, userId: string) {
    return this.lifecycleService.pauseWorkTimer(workOrderId, userId);
  }

  async addLOTO(workOrderId: string, data: AddLOTODto) {
    return this.lifecycleService.verifyLOTO(workOrderId, data);
  }

  /**
   * Multi-Level Approval Process
   * Verifies if current user has the role required for the next step in the chain
   */
  async processApproval(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    notes?: string,
  ) {
    const res: any = await this.lifecycleService.processApproval(id, status, notes);
    if (res && res.userId) {
      await this.notificationsService.create({
        type: status === 'APPROVED' ? 'STATUS_CHANGE' : 'SYSTEM_ALERT',
        title: `Request ${status === 'APPROVED' ? 'Approved' : 'Declined'}: ${res.title}`,
        content: `Your work order request #${res.workOrderNo} has been ${status.toLowerCase()}.${notes ? ` Reason/Notes: ${notes}` : ''}`,
        userId: res.userId,
        organizationId: res.organizationId,
        metaData: { workOrderId: res.id, actionUrl: `/work-orders?id=${res.id}` },
      });
    }
    if (status === 'APPROVED' && res && res.assignedToId) {
      this.notificationsService.notifyAssignment(res);
    }
    return res;
  }

  // ── SCHEDULING INTELLIGENCE ──────────────────────────────────────────

  async bulkUpdate(
    updates: { id: string; assignedToId?: string; startDate?: string | Date }[],
  ) {
    return this.schedulerService.bulkUpdate(updates);
  }

  async bulkUnassign(workOrderIds: string[]) {
    await this.prisma.workOrder.updateMany({
      where: {
        id: { in: workOrderIds },
        organizationId: TenancyContext.organizationId,
      },
      data: {
        assignedToId: null,
        startDate: null,
      }
    });
    return { success: true, count: workOrderIds.length };
  }

  async smartSchedule(dto: SmartScheduleDto) {
    return this.schedulerService.smartSchedule(dto);
  }

  // ── SHARING & COLLABORATION ──────────────────────────────────────────

  async share(id: string) {
    return this.collaborationService.share(id);
  }

  async unshare(id: string) {
    return this.collaborationService.unshare(id);
  }

  async findShared(token: string) {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { shareToken: token, isShared: true },
      include: {
        ...WO_INCLUDES,
        files: true,
        comments: {
          include: { user: { include: { user: { select: { name: true } } } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!workOrder) {
      throw new NotFoundException(
        'Shared Work Order not found or link has expired',
      );
    }

    return workOrder;
  }

  async updateSharedStatus(token: string, status: any) {
    // Restrict which statuses can be set via the public (unauthenticated) share link.
    // This prevents abuse such as setting arbitrary/invalid statuses.
    const ALLOWED_PUBLIC_STATUSES = ['IN_PROGRESS', 'COMPLETED', 'ON_HOLD'];
    if (!status || !ALLOWED_PUBLIC_STATUSES.includes(status)) {
      throw new BadRequestException(
        `Invalid status. Public links can only set status to: ${ALLOWED_PUBLIC_STATUSES.join(', ')}.`,
      );
    }

    const workOrder = await this.findShared(token);

    return this.prisma.workOrder.update({
      where: { id: workOrder.id },
      data: { status },
    });
  }


  async applyTemplate(id: string, templateId: string) {
    const organizationId = TenancyContext.organizationId || '';
    
    // 1. Get the template
    const templates = await this.checklistsService.getTemplates();
    const template = templates.find((t) => t.id === templateId);
    if (!template) throw new NotFoundException('Protocol Template not found');

    // 2. Create the checklist
    const newChecklist = await this.prisma.checklist.create({
      data: {
        title: template.title,
        description: template.description,
        organizationId,
        items: {
          create: template.items.map((item: any) => ({
            task: item.task,
            dataType: item.dataType,
            isRequired: item.isRequired,
            order: item.order,
          })),
        },
      },
    });

    // 3. Link it to the work order
    return this.prisma.workOrder.update({
      where: { id },
      data: { checklistId: newChecklist.id },
      include: WO_INCLUDES,
    });
  }

  async removeFile(fileId: string) {
    return this.collaborationService.removeFile(fileId);
  }

  async deferWorkOrder(id: string, dto: DeferWorkOrderDto) {
    const userOrgId = TenancyContext.userOrgId;
    const organizationId = TenancyContext.organizationId || '';
    if (!userOrgId) throw new ForbiddenException('No user context');

    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id, organizationId },
    });
    if (!workOrder) throw new NotFoundException('Work Order not found');

    const deferredUntil = new Date(dto.deferredUntilDate);
    if (deferredUntil < new Date()) {
      throw new BadRequestException('Deferred until date must be in the future.');
    }

    const updated = await this.prisma.workOrder.update({
      where: { id },
      data: {
        status: 'ON_HOLD',
        onHoldReason: dto.onHoldReason,
        deferredUntilDate: deferredUntil,
        deferredRiskLevel: dto.deferredRiskLevel,
        deferredComments: dto.deferredComments || null,
        deferredById: userOrgId,
        deferredAt: new Date(),
      },
      include: WO_INCLUDES,
    });

    await this.prisma.workOrderStatusHistory.create({
      data: {
        workOrderId: id,
        fromStatus: workOrder.status,
        toStatus: 'ON_HOLD',
        changedById: userOrgId,
        reason: `Deferred: ${dto.onHoldReason}`,
      } as any,
    });

    this.eventEmitter.emit(AppEvents.WORKORDER_DEFERRED, {
      id,
      userId: userOrgId,
      organizationId,
    });

    return updated;
  }

  async resumeWorkOrder(id: string) {
    const userOrgId = TenancyContext.userOrgId;
    const organizationId = TenancyContext.organizationId || '';
    if (!userOrgId) throw new ForbiddenException('No user context');

    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id, organizationId },
    });
    if (!workOrder) throw new NotFoundException('Work Order not found');
    if (workOrder.status !== 'ON_HOLD') {
      throw new BadRequestException('Work Order is not on hold/deferred.');
    }

    const updated = await this.prisma.workOrder.update({
      where: { id },
      data: {
        status: 'OPEN',
        deferredUntilDate: null,
        // We keep deferredRiskLevel and comments for audit trail, or we could clear them. 
        // We'll keep them but nullify the date so it is no longer actively deferred.
      },
      include: WO_INCLUDES,
    });

    await this.prisma.workOrderStatusHistory.create({
      data: {
        workOrderId: id,
        fromStatus: 'ON_HOLD',
        toStatus: 'OPEN',
        changedById: userOrgId,
        reason: `Resumed from deferred state`,
      } as any,
    });

    this.eventEmitter.emit(AppEvents.WORKORDER_RESUMED, {
      id,
      userId: userOrgId,
      organizationId,
    });

    return updated;
  }
}
