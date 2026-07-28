import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AssetSchedulesService } from './asset-schedules.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/permissions/permission.enum';
import { TenancyContext } from '../common/tenancy.context';

@Controller('asset-schedules')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AssetSchedulesController {
  constructor(private readonly assetSchedulesService: AssetSchedulesService) {}

  @RequirePermissions(Permission.READ_ASSET)
  @Get()
  findAll() {
    const organizationId = TenancyContext.organizationId;
    return this.assetSchedulesService.findAll(organizationId);
  }

  @RequirePermissions(Permission.UPDATE_ASSET)
  @Post()
  create(@Body() data: any) {
    const organizationId = TenancyContext.organizationId;
    return this.assetSchedulesService.create(organizationId, data);
  }

  @RequirePermissions(Permission.UPDATE_ASSET)
  @Delete(':id')
  remove(@Param('id') id: string) {
    const organizationId = TenancyContext.organizationId;
    return this.assetSchedulesService.remove(id, organizationId);
  }
}
