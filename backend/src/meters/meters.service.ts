import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMeterDto } from './dto/create-meter.dto';
import { UpdateMeterDto } from './dto/update-meter.dto';
import { PMService } from '../pm/pm.service';
import { TenancyContext } from '../common/tenancy.context';

@Injectable()
export class MetersService {
  constructor(
    private prisma: PrismaService,
    private pmService: PMService,
  ) {}

  async create(createMeterDto: CreateMeterDto) {
    return this.prisma.meter.create({
      data: createMeterDto,
    });
  }

  async findAll() {
    const organizationId = TenancyContext.organizationId;
    return this.prisma.meter.findMany({
      where: { organizationId },
      include: { 
        asset: { include: { location: true } },
        location: true,
        category: true,
        assignedTo: { include: { user: true } }
      },
    });
  }

  async findOne(id: string) {
    const organizationId = TenancyContext.organizationId;
    const meter = await this.prisma.meter.findFirst({
      where: { id, organizationId },
      include: { asset: true, readings: true },
    });
    if (!meter) {
      throw new NotFoundException(`Meter with ID ${id} not found`);
    }
    return meter;
  }

  async update(id: string, updateMeterDto: UpdateMeterDto) {
    await this.findOne(id);
    return this.prisma.meter.update({
      where: { id },
      data: updateMeterDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.meter.delete({ where: { id } });
    return { message: 'Meter deleted successfully' };
  }

  async getReadings(meterId: string) {
    await this.findOne(meterId);
    const readings = await this.prisma.meterReading.findMany({
      where: { meterId },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch user details for each reading if recordedById is set
    const userOrgIds = readings.map((r) => r.recordedById).filter(Boolean) as string[];
    const userOrgs =
      userOrgIds.length > 0
        ? await this.prisma.userOrganization.findMany({
            where: { id: { in: userOrgIds } },
            include: { user: true },
          })
        : [];

    const userOrgMap = new Map(userOrgs.map((uo) => [uo.id, uo]));

    return readings.map((r) => {
      const uo = r.recordedById ? userOrgMap.get(r.recordedById) : null;
      return {
        ...r,
        user: uo
          ? {
              name: uo.user.name,
              email: uo.user.email,
            }
          : { name: 'System User' },
      };
    });
  }

  async addReading(createMeterReadingDto: any, userOrgId?: string) {
    await this.findOne(createMeterReadingDto.meterId);
    const reading = await this.prisma.meterReading.create({
      data: {
        ...createMeterReadingDto,
        recordedById: userOrgId || null,
      },
    });

    // --- Preventive Maintenance Trigger Check ---
    await this.pmService.checkMeterTriggers(
      createMeterReadingDto.meterId,
      createMeterReadingDto.value,
    );

    // Update current value on the meter record
    await this.prisma.meter.update({
      where: { id: createMeterReadingDto.meterId },
      data: { currentValue: createMeterReadingDto.value },
    });

    return reading;
  }
}
