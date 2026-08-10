import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { TenancyContext } from '../common/tenancy.context';
import { AssetQueryDto } from './dto/asset-query.dto';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  AppEvents,
  AssetDownPayload,
  MeterReadingLoggedPayload,
} from '../events/app-events';
import { Prisma, Asset } from '@prisma/client';

const ASSET_INCLUDES = {
  location: { select: { id: true, name: true, type: true } },
  _count: { select: { workOrders: true, attachments: true } },
  custodian: { include: { user: { select: { id: true, name: true, email: true } } } },
  team: { select: { id: true, name: true } },
  vendor: { select: { id: true, name: true } },
  customer: { select: { id: true, name: true } },
  parent: { select: { id: true, name: true, status: true } },
} as const;

export type AssetWithRelations = Prisma.AssetGetPayload<{
  include: typeof ASSET_INCLUDES;
}>;

@Injectable()
export class AssetsService {
  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(createAssetDto: CreateAssetDto): Promise<Asset> {
    const organizationId = TenancyContext.organizationId || '';
    const userId = TenancyContext.userId;

    return this.prisma.asset.create({
      data: {
        ...createAssetDto,
        organizationId,
      } as any,
      include: { location: true },
    });
  }

  async findAll(query?: AssetQueryDto) {
    const organizationId = TenancyContext.organizationId || '';
    const {
      page,
      limit,
      search,
      status,
      criticality,
      locationId,
      categoryId,
      parentAssetId,
    } = query || {};

    const where: Prisma.AssetWhereInput = {};

    if (status) where.status = status as any;
    if (criticality) where.criticality = criticality as any;
    if (locationId) where.locationId = locationId;
    if (categoryId) where.categoryId = categoryId;
    if (parentAssetId) where.parentAssetId = parentAssetId;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { qrCode: { contains: search, mode: 'insensitive' } },
        { barCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (!page && !limit && !search && !status && !criticality) {
      const rawItems = await this.prisma.asset.findMany({
        where,
        include: ASSET_INCLUDES as any,
        orderBy: { name: 'asc' },
      });
      return rawItems.map((asset) => ({
        ...asset,
        financials: this.calculateDepreciation(asset),
      }));
    }

    const currentPage = Number(page) || 1;
    const currentLimit = Number(limit) || 20;
    const skip = (currentPage - 1) * currentLimit;

    const [items, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        include: ASSET_INCLUDES as any,
        orderBy: { name: 'asc' },
        skip,
        take: currentLimit,
      }),
      this.prisma.asset.count({ where }),
    ]);

    const itemsWithFinancials = items.map((asset) => ({
      ...asset,
      financials: this.calculateDepreciation(asset),
    }));

    return {
      items: itemsWithFinancials,
      meta: {
        total,
        page: currentPage,
        limit: currentLimit,
        totalPages: Math.ceil(total / currentLimit),
      },
    };
  }

  async findOne(id: string): Promise<AssetWithRelations> {
    const organizationId = TenancyContext.organizationId || '';
    const asset = await this.prisma.asset.findFirst({
      where: { id, organizationId },
      include: {
        location: true,
        meters: true,
        attachments: { orderBy: { createdAt: 'desc' } },
        parent: { select: { id: true, name: true, status: true } },
        children: {
          select: { id: true, name: true, status: true, criticality: true },
        },
        custodian: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        pmSchedules: { select: { id: true, name: true } },
        spareParts: {
          include: {
            part: {
              select: { id: true, name: true, partNumber: true, quantity: true, category: true }
            }
          }
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        workOrders: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID ${id} not found`);
    }

    (asset as any).financials = this.calculateDepreciation(asset);
    return asset as any;
  }

  async findByCode(code: string): Promise<Asset> {
    const organizationId = TenancyContext.organizationId || '';
    const asset = await this.prisma.asset.findFirst({
      where: {
        organizationId,
        OR: [{ qrCode: code }, { barCode: code }],
      },
      include: { location: true },
    });

    if (!asset) {
      throw new NotFoundException(`No asset found with code: ${code}`);
    }

    return asset;
  }

  async update(
    id: string,
    updateAssetDto: UpdateAssetDto,
  ): Promise<Asset> {
    const existing = await this.findOne(id);
    const userOrgId = TenancyContext.userOrgId;
    const organizationId = TenancyContext.organizationId || '';
    const { statusChangeReason, ...rest } = updateAssetDto;
    const data: any = { ...rest };

    const proposedParentId = (updateAssetDto as any).parentAssetId || (updateAssetDto as any).parentId;
    if (proposedParentId) {
      if (proposedParentId === id) {
        throw new BadRequestException('An asset cannot be its own parent.');
      }
      // Traverse up parent chain to detect loops
      let currId: string | null = proposedParentId;
      const visited = new Set<string>([id]);
      while (currId) {
        if (visited.has(currId)) {
          throw new BadRequestException('Circular asset parent relationship detected.');
        }
        visited.add(currId);
        const parentAsset = await this.prisma.asset.findUnique({
          where: { id: currId },
          select: { parentAssetId: true, parentId: true } as any,
        });
        currId = (parentAsset as any)?.parentAssetId || (parentAsset as any)?.parentId || null;
      }
    }

    if (updateAssetDto.status && updateAssetDto.status !== existing.status) {
      const fromStatus = existing.status;
      const toStatus = updateAssetDto.status;

      await this.prisma.assetStatusHistory.create({
        data: {
          assetId: id,
          fromStatus,
          toStatus: toStatus as any,
          changedById: userOrgId,
          reason: statusChangeReason || null,
        },
      });

      if (toStatus === 'DOWN' && fromStatus !== 'DOWN') {
        data.downtimeStartedAt = new Date();
        this.notificationsGateway.notifyAssetDown({
          id,
          name: existing.name,
          location: (existing as any).location?.name,
          timestamp: new Date(),
        });

        const downPayload: AssetDownPayload = {
          id,
          name: existing.name,
          status: toStatus,
          organizationId,
        };
        this.eventEmitter.emit(AppEvents.ASSET_DOWN, downPayload);
      }

      if (
        fromStatus === 'DOWN' &&
        toStatus !== 'DOWN' &&
        existing.downtimeStartedAt
      ) {
        const downtimeMs =
          Date.now() - new Date(existing.downtimeStartedAt).getTime();
        const downtimeMinutes = Math.floor(downtimeMs / 60000);
        data.totalDowntimeMinutes =
          (existing.totalDowntimeMinutes || 0) + downtimeMinutes;
        data.downtimeStartedAt = null;
      }
    }

    return this.prisma.asset.update({
      where: { id, organizationId },
      data,
    });
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    const organizationId = TenancyContext.organizationId || '';
    const userId = TenancyContext.userId;

    await this.prisma.asset.delete({
      where: { id, organizationId },
    });

    return { message: 'Asset deleted successfully' };
  }

  async bulkRemove(ids: string[]) {
    const organizationId = TenancyContext.organizationId || '';
    if (!ids || ids.length === 0) return { message: 'No assets selected' };

    await this.prisma.asset.deleteMany({
      where: { 
        id: { in: ids },
        organizationId 
      },
    });

    return { message: `${ids.length} assets deleted successfully` };
  }

  async addAttachment(assetId: string, file: Express.Multer.File) {
    await this.findOne(assetId);
    const userOrgId = TenancyContext.userOrgId;

    return this.prisma.assetFile.create({
      data: {
        assetId,
        filename: file.originalname,
        url: `/files/${file.filename}`,
        mimeType: file.mimetype,
        size: file.size,
        uploadedById: userOrgId,
      },
    });
  }

  async removeAttachment(assetId: string, fileId: string) {
    const file = await this.prisma.assetFile.findFirst({
      where: { id: fileId, assetId },
    });

    if (!file) {
      throw new NotFoundException('Attachment not found on this asset');
    }

    await this.prisma.assetFile.delete({ where: { id: fileId } });
    return { message: 'Attachment removed' };
  }

  async getStatusHistory(assetId: string) {
    await this.findOne(assetId);
    return this.prisma.assetStatusHistory.findMany({
      where: { assetId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getReliabilityMetrics(assetId: string) {
    const asset = await this.findOne(assetId);
    const history = await this.prisma.assetStatusHistory.findMany({
      where: { assetId },
      orderBy: { createdAt: 'asc' },
    });

    let totalDowntimeMs = 0;
    let breakdownCount = 0;
    let lastDownStart: Date | null = null;

    const firstStatusDate = history[0]?.createdAt || asset.createdAt;

    history.forEach((event) => {
      if (event.toStatus === 'DOWN') {
        breakdownCount++;
        lastDownStart = new Date(event.createdAt);
      } else if (event.toStatus === 'OPERATIONAL' && lastDownStart) {
        totalDowntimeMs +=
          new Date(event.createdAt).getTime() - lastDownStart.getTime();
        lastDownStart = null;
      }
    });

    if (asset.status === 'DOWN' && asset.downtimeStartedAt) {
      totalDowntimeMs +=
        Date.now() - new Date(asset.downtimeStartedAt).getTime();
    }

    const totalOperationalTimeMs =
      Date.now() - (firstStatusDate?.getTime() || Date.now());

    const mttrHours =
      breakdownCount > 0
        ? totalDowntimeMs / (1000 * 60 * 60) / breakdownCount
        : 0;
    const mttfHours =
      breakdownCount > 0
        ? (totalOperationalTimeMs - totalDowntimeMs) /
          (1000 * 60 * 60) /
          breakdownCount
        : 0;

    const mtbfHours = mttfHours + mttrHours;

    const uptimePercentage =
      totalOperationalTimeMs > 0
        ? ((totalOperationalTimeMs - totalDowntimeMs) /
            totalOperationalTimeMs) *
          100
        : 100;

    return {
      mttr: Number(mttrHours.toFixed(2)),
      mttf: Number(mttfHours.toFixed(2)),
      mtbf: Number(mtbfHours.toFixed(2)),
      uptime: Number(uptimePercentage.toFixed(1)),
      breakdowns: breakdownCount,
      totalDowntimeMinutes: Math.floor(totalDowntimeMs / 60000),
    };
  }

  async logMeterReading(
    assetId: string,
    meterId: string,
    value: number,
    notes?: string,
  ) {
    const meter = await this.prisma.meter.findFirst({
      where: { id: meterId, assetId },
    });

    if (!meter) {
      throw new NotFoundException(
        `Meter ${meterId} not found on asset ${assetId}`,
      );
    }

    const userOrgId = TenancyContext.userOrgId;
    const reading = await this.prisma.meterReading.create({
      data: { meterId, value, recordedById: userOrgId, notes: notes || null },
    });

    await this.prisma.meter.update({
      where: { id: meterId },
      data: { currentValue: value },
    });

    const organizationId = TenancyContext.organizationId || '';
    const meterPayload: MeterReadingLoggedPayload = {
      assetId,
      meterId,
      value,
      organizationId,
    };
    this.eventEmitter.emit(AppEvents.METER_READING_LOGGED, meterPayload);

    return reading;
  }

  private calculateDepreciation(asset: any) {
    if (
      !asset.purchasePrice ||
      !asset.placedInServiceDate ||
      !asset.usefulLifeYears
    ) {
      return {
        currentBookValue: asset.purchasePrice || 0,
        depreciationToDate: 0,
      };
    }

    const purchasePrice = asset.purchasePrice;
    const residualValue = asset.residualValue || 0;
    const usefulLifeYears = asset.usefulLifeYears;
    const inServiceDate = new Date(asset.placedInServiceDate);
    const ageMs = Date.now() - inServiceDate.getTime();
    const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365.25);

    if (asset.depreciationMethod === 'STRAIGHT_LINE') {
      const annualDepreciation =
        (purchasePrice - residualValue) / usefulLifeYears;
      const totalDepreciation = Math.min(
        annualDepreciation * ageYears,
        purchasePrice - residualValue,
      );
      return {
        currentBookValue: Number(
          (purchasePrice - totalDepreciation).toFixed(2),
        ),
        depreciationToDate: Number(totalDepreciation.toFixed(2)),
        annualRate: Number(annualDepreciation.toFixed(2)),
      };
    }

    return { currentBookValue: purchasePrice, depreciationToDate: 0 };
  }
}
