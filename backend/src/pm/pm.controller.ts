import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permissions } from '../auth/permissions/permissions.constants';
import { PMService } from './pm.service';
import { CreatePMScheduleDto } from './dto/create-pm-schedule.dto';
import { UpdatePMScheduleDto } from './dto/update-pm-schedule.dto';
import { TenancyContext } from '../common/tenancy.context';

@Controller('pm-schedules')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PMController {
  constructor(
    private prisma: PrismaService,
    private readonly pmService: PMService,
  ) {}

  @RequirePermissions(Permissions.PREVENTIVE_MAINTENANCE.READ)
  @Get()
  findAll() {
    return this.pmService.findAll();
  }

  @RequirePermissions(Permissions.PREVENTIVE_MAINTENANCE.READ)
  @Get('templates')
  findAllTemplates() {
    const organizationId = TenancyContext.organizationId;
    return this.prisma.pMScheduleTemplate.findMany({
      where: { 
        OR: [{ organizationId }, { isSystem: true }] 
      },
      include: { checklist: { include: { items: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  @RequirePermissions(Permissions.PREVENTIVE_MAINTENANCE.CREATE)
  @Post()
  create(@Body() data: CreatePMScheduleDto) {
    return this.pmService.create(data);
  }

  @RequirePermissions(Permissions.PREVENTIVE_MAINTENANCE.UPDATE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() data: UpdatePMScheduleDto) {
    return this.pmService.update(id, data);
  }

  @RequirePermissions(Permissions.PREVENTIVE_MAINTENANCE.DELETE)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pmService.remove(id);
  }
}
