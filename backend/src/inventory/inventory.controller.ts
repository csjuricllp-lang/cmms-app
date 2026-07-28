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
import { TenancyContext } from '../common/tenancy.context';
import { InventoryService } from './inventory.service';

@Controller('parts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InventoryController {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
  ) {}

  @RequirePermissions(Permissions.PARTS.READ)
  @Get()
  findAll() {
    const organizationId = TenancyContext.organizationId;
    return this.prisma.part.findMany({
      where: { organizationId, deletedAt: null },
      include: { location: true },
    });
  }

  @RequirePermissions(Permissions.PARTS.READ)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.prisma.part.findUnique({
      where: { id },
      include: { transactions: { take: 10, orderBy: { createdAt: 'desc' } } },
    });
  }

  @RequirePermissions(Permissions.PARTS.CREATE)
  @Post()
  create(@Body() data: any) {
    const organizationId = TenancyContext.organizationId || '';
    return this.prisma.part.create({
      data: { ...data, organizationId },
    });
  }

  @RequirePermissions(Permissions.PARTS.UPDATE)
  @Post(':id/adjust')
  adjustStock(
    @Param('id') id: string,
    @Body('delta') delta: number,
    @Body('type') type: any,
  ) {
    return this.inventoryService.adjustStock(id, delta, type);
  }

  @RequirePermissions(Permissions.PARTS.DELETE)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.prisma.part.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
